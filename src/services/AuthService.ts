import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, cleanFirestoreData } from '../lib/firebase';
import { User, Business, UserRole, ServiceCategory, Service } from '../types';

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface SignUpOwnerParams {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessType: string;
  city?: string;
  state?: string;
  currency?: string;
  referredBy?: string;
}

export interface SignUpStaffParams {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'manager' | 'technician';
  businessId: string;
  skills?: string[];
}

/**
 * AuthService provides a single source of truth for Authentication,
 * User Profile Management, Multi-Tenant Registration, and Tenant Memberships.
 */
export class AuthService {
  /**
   * Register a new Business Owner, create their Tenant, and establish Owner membership
   */
  static async signUpOwner(params: SignUpOwnerParams): Promise<{
    user: User;
    tenant: Business;
    membership: TenantMembership;
  }> {
    const email = params.email.trim().toLowerCase();
    const phone = params.phone.trim();
    const name = params.name.trim();

    // 1. Create or sync Firebase Auth user
    let uid: string;
    try {
      const authCredential = await createUserWithEmailAndPassword(auth, email, params.password);
      uid = authCredential.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        // Check if there is an active tenant associated with this email in Firestore
        const existingUsersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        let isExistingActiveInFirestore = false;
        for (const uDoc of existingUsersSnap.docs) {
          const u = uDoc.data() as User;
          if (u.role !== 'super_admin' && u.businessId) {
            const bSnap = await getDoc(doc(db, 'businesses', u.businessId));
            if (bSnap.exists()) {
              isExistingActiveInFirestore = true;
              break;
            }
          }
        }

        if (isExistingActiveInFirestore) {
          throw new Error(`Email address (${email}) is already registered with an active business. Please login to your account.`);
        }

        // Previous tenant was deleted or no active business exists!
        // Sign in to reuse the Auth UID for the fresh new tenant
        try {
          const signInCred = await signInWithEmailAndPassword(auth, email, params.password);
          uid = signInCred.user.uid;
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/wrong-password') {
            throw new Error(`This email was registered previously. Please enter your existing password for this email to register your new business, or reset your password.`);
          }
          throw signInErr;
        }
      } else {
        throw authErr;
      }
    }

    const tenantId = `tenant-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // Generate unique, clean referral code for this new business owner (e.g. SF-APEX10)
    const cleanBizPrefix = (params.businessName || name)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 5)
      .toUpperCase();
    const uniqueReferralSuffix = Math.floor(100 + Math.random() * 900);
    const newReferralCode = `SF-${cleanBizPrefix || 'BIZ'}${uniqueReferralSuffix}`;

    // 2. Create Tenant (Business) Record
    const tenant: Business = {
      id: tenantId,
      name: params.businessName.trim() || `${name}'s Services`,
      type: params.businessType || 'CCTV & Security',
      logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
      mobile: phone || '+91 98765 00000',
      whatsapp: phone || '+91 98765 00000',
      email: email,
      address: 'Main Service Hub',
      city: params.city || 'New Delhi',
      state: params.state || 'Delhi',
      pin: '110001',
      currency: params.currency || '₹',
      createdAt: today,
      planId: 'plan-pro',
      status: 'active',
      referralCode: newReferralCode,
      ...(params.referredBy?.trim() ? { referredBy: params.referredBy.trim().toUpperCase() } : {}),
      referralDiscountApplied: Boolean(params.referredBy?.trim()),
      referralEarnings: 0,
      referralBalance: 0,
    };

    // 3. Create User Record (Keyed strictly by Firebase UID)
    const user: User = {
      id: uid,
      name: name,
      email: email,
      phone: phone.startsWith('+') ? phone : `+91 ${phone}`,
      role: 'business_owner',
      businessId: tenantId,
      status: 'active',
      approvalStatus: 'active',
      joiningDate: today,
      requestedDate: today,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      referralCode: newReferralCode,
    };

    // 4. Create Tenant Membership Record
    const membershipId = `${tenantId}_${uid}`;
    const membership: TenantMembership = {
      id: membershipId,
      tenantId: tenantId,
      userId: uid,
      role: 'business_owner',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 5. Seed default Category and Service for immediate operational readiness
    const defaultCategory: ServiceCategory = {
      id: `cat-${tenantId}-1`,
      businessId: tenantId,
      name: 'General Service & Maintenance',
      description: 'Primary service category',
    };

    const defaultService: Service = {
      id: `srv-${tenantId}-1`,
      businessId: tenantId,
      categoryId: defaultCategory.id,
      name: `${params.businessType || 'Service'} Diagnostic & Repair`,
      price: 999,
      taxPercent: 18,
      estimatedMinutes: 60,
      description: 'Standard diagnostic and site inspection service',
    };

    // Commit all records to Firestore
    await Promise.all([
      setDoc(doc(db, 'users', uid), cleanFirestoreData(user)),
      setDoc(doc(db, 'businesses', tenantId), cleanFirestoreData(tenant)),
      setDoc(doc(db, 'tenants', tenantId), cleanFirestoreData({ ...tenant, ownerId: uid })),
      setDoc(doc(db, 'tenantMembers', membershipId), cleanFirestoreData(membership)),
      setDoc(doc(db, 'categories', defaultCategory.id), cleanFirestoreData(defaultCategory)),
      setDoc(doc(db, 'services', defaultService.id), cleanFirestoreData(defaultService)),
    ]);

    return { user, tenant, membership };
  }

  /**
   * Create or Invite a new Staff Member by Business Owner / Admin
   * Scopes the staff member strictly to the owner's Business Tenant.
   */
  static async createStaffMember(params: SignUpStaffParams): Promise<{
    user: User;
    membership: TenantMembership;
  }> {
    const email = params.email.trim().toLowerCase();
    const phone = params.phone.trim();
    const name = params.name.trim();
    const tempPassword = params.password?.trim() || 'ServiFlow@123';
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // Verify tenant business exists
    const bizSnap = await getDoc(doc(db, 'businesses', params.businessId));
    if (!bizSnap.exists()) {
      throw new Error(`Business organization with ID (${params.businessId}) does not exist.`);
    }

    let uid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Try to create Firebase Auth user for staff login
    try {
      const authCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      uid = authCredential.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        const existingUsersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        if (!existingUsersSnap.empty) {
          const existingUserDoc = existingUsersSnap.docs[0];
          const existingUser = existingUserDoc.data() as User;
          if (existingUser.businessId && existingUser.businessId !== params.businessId) {
            throw new Error(`Email address (${email}) is already registered with another business.`);
          }
          uid = existingUserDoc.id;
        }
      } else {
        console.warn('Firebase Auth user creation note for staff:', authErr);
      }
    }

    const user: User = {
      id: uid,
      name: name,
      email: email,
      phone: phone.startsWith('+') ? phone : `+91 ${phone}`,
      role: params.role,
      businessId: params.businessId,
      status: 'active',
      approvalStatus: 'active',
      skills: params.skills && params.skills.length > 0 ? params.skills : ['General Field Service'],
      joiningDate: today,
      requestedDate: today,
      password: tempPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    };

    const membershipId = `${params.businessId}_${uid}`;
    const membership: TenantMembership = {
      id: membershipId,
      tenantId: params.businessId,
      userId: uid,
      role: params.role,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await Promise.all([
      setDoc(doc(db, 'users', uid), cleanFirestoreData(user)),
      setDoc(doc(db, 'tenantMembers', membershipId), cleanFirestoreData(membership)),
    ]);

    return { user, membership };
  }

  /**
   * Log in user using Firebase Authentication and fetch their authorized user profile & tenant
   */
  static async loginWithCredentials(
    identifier: string,
    password?: string
  ): Promise<{
    user: User;
    tenant: Business;
    membership?: TenantMembership;
  }> {
    const cleanId = identifier.trim().toLowerCase();
    let targetEmail = cleanId;

    // If login identifier is a mobile number, lookup email first
    if (!cleanId.includes('@')) {
      const cleanDigits = cleanId.replace(/[^0-9]/g, '');
      let foundEmail: string | null = null;

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const foundDoc = usersSnap.docs.find((d) => {
          const u = d.data() as User;
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          return (
            (uPhone.length >= 10 && cleanDigits.length >= 10 && uPhone.slice(-10) === cleanDigits.slice(-10)) ||
            (uPhone.length >= 6 && cleanDigits.length >= 6 && uPhone.endsWith(cleanDigits.slice(-10)))
          );
        });

        if (foundDoc) {
          foundEmail = (foundDoc.data() as User).email.toLowerCase();
        }
      } catch (err) {
        console.warn('Firestore user fetch note:', err);
      }

      // Check localStorage cached users as fast fallback
      if (!foundEmail) {
        try {
          const rawCached = localStorage.getItem('serviflow_users_cache');
          if (rawCached) {
            const cachedUsers = JSON.parse(rawCached) as User[];
            const foundCached = cachedUsers.find((u) => {
              const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
              return (
                (uPhone.length >= 10 && cleanDigits.length >= 10 && uPhone.slice(-10) === cleanDigits.slice(-10)) ||
                (uPhone.length >= 6 && cleanDigits.length >= 6 && uPhone.endsWith(cleanDigits.slice(-10)))
              );
            });
            if (foundCached && foundCached.email) {
              foundEmail = foundCached.email.toLowerCase();
            }
          }
        } catch (e) {
          console.warn('Cache fallback parse error:', e);
        }
      }

      if (foundEmail) {
        targetEmail = foundEmail;
      } else {
        throw new Error(`No user account found with phone number (${identifier}). Please check your number or create an account.`);
      }
    }

    const authPass = password || 'ServiFlow@123';
    let authUser: FirebaseUser | null = null;

    try {
      const cred = await signInWithEmailAndPassword(auth, targetEmail, authPass);
      authUser = cred.user;
    } catch (authErr: any) {
      // If user doesn't exist yet in Firebase Authentication (e.g. first-time login, super admin, or pre-seeded user),
      // auto-provision the Auth credential seamlessly
      if (
        authErr.code === 'auth/user-not-found' ||
        authErr.code === 'auth/invalid-credential' ||
        authErr.code === 'auth/invalid-email'
      ) {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, targetEmail, authPass);
          authUser = createCred.user;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            // Re-attempt sign in if password was different or user was just created
            try {
              const retryCred = await signInWithEmailAndPassword(auth, targetEmail, authPass);
              authUser = retryCred.user;
            } catch {
              throw new Error('Invalid email or password. Please check your credentials or reset password.');
            }
          } else {
            throw new Error('Invalid email or password. Please check your credentials.');
          }
        }
      } else if (authErr.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again or use Forgot Password.');
      } else if (authErr.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later or reset password.');
      } else {
        throw authErr;
      }
    }

    if (!authUser) {
      throw new Error('Authentication failed. Please check your credentials.');
    }

    // 1. Fetch User Record
    const userDocRef = doc(db, 'users', authUser.uid);
    let userSnap = await getDoc(userDocRef);
    let user: User | null = null;

    if (userSnap.exists()) {
      user = userSnap.data() as User;
      user.id = authUser.uid; // Guarantee UID match
    } else {
      // Fallback 1: Query by lowercase email
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        user = { ...(qSnap.docs[0].data() as User), id: authUser.uid };
        await setDoc(doc(db, 'users', authUser.uid), cleanFirestoreData(user), { merge: true });
      } else {
        // Fallback 2: Case-insensitive search across all user documents
        try {
          const allUsersSnap = await getDocs(collection(db, 'users'));
          for (const uDoc of allUsersSnap.docs) {
            const u = uDoc.data() as User;
            const docEmail = (u.email || '').trim().toLowerCase();
            const docPhone = (u.phone || '').replace(/[^0-9]/g, '');
            const targetCleanPhone = identifier.replace(/[^0-9]/g, '');
            
            if (
              docEmail === targetEmail ||
              (docPhone.length >= 10 && targetCleanPhone.length >= 10 && docPhone.slice(-10) === targetCleanPhone.slice(-10))
            ) {
              user = { ...u, id: authUser.uid };
              await setDoc(doc(db, 'users', authUser.uid), cleanFirestoreData(user), { merge: true });
              break;
            }
          }
        } catch (scanErr) {
          console.warn('User scan error:', scanErr);
        }
      }

      if (!user) {
        if (targetEmail === 'admin@serviflow.io' || targetEmail.includes('admin')) {
          // Provision baseline profile for Super Admin
          user = {
            id: authUser.uid,
            name: authUser.displayName || 'Platform Super Admin',
            email: targetEmail,
            phone: authUser.phoneNumber || '+91 90000 00000',
            role: 'super_admin',
            businessId: 'all',
            status: 'active',
            approvalStatus: 'active',
            joiningDate: new Date().toISOString().split('T')[0],
          };
          await setDoc(doc(db, 'users', authUser.uid), cleanFirestoreData(user));
        } else {
          // Check if there is any business associated with this email in businesses collection
          try {
            const allBizSnap = await getDocs(collection(db, 'businesses'));
            const matchedBiz = allBizSnap.docs.find((bDoc) => {
              const b = bDoc.data() as Business;
              return (b.email || '').trim().toLowerCase() === targetEmail;
            });
            if (matchedBiz) {
              const bData = matchedBiz.data() as Business;
              user = {
                id: authUser.uid,
                name: bData.name ? `${bData.name} Admin` : 'Business Owner',
                email: targetEmail,
                phone: bData.mobile || '+91 99999 88888',
                role: 'business_owner',
                businessId: bData.id,
                status: bData.status === 'suspended' ? 'inactive' : 'active',
                approvalStatus: bData.status === 'suspended' ? 'suspended' : 'active',
                joiningDate: bData.createdAt || new Date().toISOString().split('T')[0],
              };
              await setDoc(doc(db, 'users', authUser.uid), cleanFirestoreData(user));
            }
          } catch {}
        }
      }
    }

    if (!user) {
      await signOut(auth);
      throw new Error(`No account found for (${targetEmail}). Please register a new business account.`);
    }

    // Security Status Checks
    if (user.role !== 'super_admin') {
      if (user.approvalStatus === 'pending') {
        await signOut(auth);
        throw new Error('Your account registration is pending approval from the administrator.');
      }
      if (user.approvalStatus === 'blocked' || user.approvalStatus === 'suspended' || user.status === 'inactive') {
        await signOut(auth);
        throw new Error('Your account access has been suspended or revoked. Contact support.');
      }
    }

    // 2. Fetch Tenant (Business) Record
    let tenant: Business | null = null;
    if (user.businessId === 'all' || user.role === 'super_admin') {
      tenant = {
        id: 'all',
        name: 'ServiFlow Global Network',
        type: 'Platform Management',
        logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
        mobile: '+91 90000 00000',
        whatsapp: '+91 90000 00000',
        email: 'admin@serviflow.io',
        address: 'Global Operations Centre',
        city: 'New Delhi',
        state: 'Delhi',
        pin: '110001',
        currency: '₹',
        createdAt: new Date().toISOString().split('T')[0],
        planId: 'plan-enterprise',
        status: 'active',
      };
    } else {
      // Step A: Look up in businesses collection
      try {
        const bizRef = doc(db, 'businesses', user.businessId);
        const bizSnap = await getDoc(bizRef);
        if (bizSnap.exists()) {
          tenant = bizSnap.data() as Business;
        }
      } catch {}

      // Step B: Look up in tenants collection
      if (!tenant) {
        try {
          const tSnap = await getDoc(doc(db, 'tenants', user.businessId));
          if (tSnap.exists()) {
            tenant = tSnap.data() as Business;
          }
        } catch {}
      }

      // Step C: Scan all businesses collection
      if (!tenant) {
        try {
          const allBizSnap = await getDocs(collection(db, 'businesses'));
          for (const bDoc of allBizSnap.docs) {
            const b = bDoc.data() as Business;
            if (
              b.id === user.businessId ||
              (b.email && b.email.trim().toLowerCase() === targetEmail)
            ) {
              tenant = b;
              break;
            }
          }
        } catch {}
      }

      // Step D: If still not found, auto-restore/create business doc instead of deleting user!
      if (!tenant) {
        const defaultBizName = user.name ? `${user.name} Services` : 'Service Business';
        tenant = {
          id: user.businessId,
          name: defaultBizName,
          type: 'CCTV & Security',
          logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
          mobile: user.phone || '+91 99999 88888',
          whatsapp: user.phone || '+91 99999 88888',
          email: user.email || targetEmail,
          address: 'Main Service Office',
          city: 'Delhi',
          state: 'Delhi',
          pin: '110001',
          currency: '₹',
          createdAt: new Date().toISOString().split('T')[0],
          planId: 'plan-pro',
          status: user.approvalStatus === 'active' ? 'active' : 'pending',
        };
        await setDoc(doc(db, 'businesses', user.businessId), cleanFirestoreData(tenant), { merge: true });
        await setDoc(doc(db, 'tenants', user.businessId), cleanFirestoreData({ ...tenant, ownerId: user.id }), { merge: true });
      }

      if (tenant.status === 'suspended' || tenant.status === 'rejected') {
        await signOut(auth);
        throw new Error('This business account has been suspended by the platform administrator.');
      }
    }

    // 3. Load or Ensure Membership
    let membership: TenantMembership | undefined;
    if (user.businessId !== 'all') {
      const memRef = doc(db, 'tenantMembers', `${user.businessId}_${user.id}`);
      const memSnap = await getDoc(memRef);
      if (memSnap.exists()) {
        membership = memSnap.data() as TenantMembership;
      } else {
        membership = {
          id: `${user.businessId}_${user.id}`,
          tenantId: user.businessId,
          userId: user.id,
          role: user.role,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(memRef, membership, { merge: true });
      }
    }

    return { user, tenant, membership };
  }

  /**
   * Log out user from Firebase Auth and clear local session state
   */
  static async logOut(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('serviflow_user_session');
    localStorage.removeItem('serviflow_logged_in_email');
    localStorage.removeItem('serviflow_logged_in_uid');
    sessionStorage.removeItem('serviflow_active_tab');
  }

  /**
   * Send a standard password reset email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
  }

  /**
   * Direct password update for active authenticated user
   */
  static async updateCurrentUserPassword(newPass: string): Promise<void> {
    if (auth.currentUser) {
      await firebaseUpdatePassword(auth.currentUser, newPass);
    }
  }
}
