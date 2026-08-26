import {
  AttendanceLocation,
  AttendanceVerificationStatus,
  AttendanceWorkingRules,
  Job,
} from '../types';

export interface GpsPositionResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GpsErrorResult {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN' | 'NOT_SUPPORTED';
  message: string;
  userFriendlyMessage: string;
}

/**
 * Calculates Great-Circle Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371e3; // Earth's radius in meters
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance in meters or kilometers with clean typography.
 */
export function formatDistance(meters?: number | null): string {
  if (meters === undefined || meters === null || isNaN(meters)) return 'Unknown distance';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats duration in minutes into 'Xh Ym' string.
 */
export function formatWorkingDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Captures real-time GPS position from device with high accuracy.
 */
export function getCurrentGpsPosition(): Promise<GpsPositionResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const err: GpsErrorResult = {
        code: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your device/browser.',
        userFriendlyMessage:
          'Aapke browser ya device me GPS location supported nahi hai. Please modern browser use karein.',
      };
      return reject(err);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 10),
          timestamp: pos.timestamp || Date.now(),
        });
      },
      (geoError) => {
        let code: GpsErrorResult['code'] = 'UNKNOWN';
        let userFriendlyMessage =
          'Location verify nahi ho pa rahi. Please Location/GPS enable karke dobara try karein.';

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED';
            userFriendlyMessage =
              'Location permission denied. Please browser / device settings me Location access allow karein.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE';
            userFriendlyMessage =
              'Device GPS signal detect nahi hua. Please device ka Location/GPS switch on karein.';
            break;
          case geoError.TIMEOUT:
            code = 'TIMEOUT';
            userFriendlyMessage =
              'GPS signal search karne me time out ho gaya. Please thoda khule area me try karein.';
            break;
        }

        const err: GpsErrorResult = {
          code,
          message: geoError.message,
          userFriendlyMessage,
        };
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export interface VerificationTargetLocation {
  id: string;
  name: string;
  type: 'office' | 'branch' | 'field_job' | 'remote' | 'warehouse';
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  jobCode?: string;
}

export interface LocationVerificationResult {
  isValid: boolean;
  verificationStatus: AttendanceVerificationStatus;
  matchedLocationName: string;
  matchedLocationType: 'office' | 'branch' | 'field_job' | 'remote' | 'warehouse';
  distanceMeters: number;
  allowedRadiusMeters: number;
  accuracyMeters: number;
  reason?: string;
}

/**
 * Verifies live captured GPS coordinate against permitted business office locations or assigned job site.
 */
export function verifyLocationAgainstRules(
  currentLat: number,
  currentLng: number,
  currentAccuracy: number,
  permittedLocations: AttendanceLocation[],
  targetType: 'office' | 'branch' | 'field_job' | 'remote' | 'warehouse',
  targetLocationIdOrJobId?: string,
  assignedJobs?: Job[],
  workingRules?: AttendanceWorkingRules
): LocationVerificationResult {
  const maxAllowedAccuracy = workingRules?.maxAllowedGpsAccuracyMeters || 200;

  // If GPS accuracy is extremely bad (e.g. > 500m), flag accuracy issue
  const hasAccuracyIssue = currentAccuracy > 500;

  // Build list of valid candidate locations
  const candidateTargets: VerificationTargetLocation[] = [];

  if (targetType === 'field_job' && assignedJobs && assignedJobs.length > 0) {
    // Check against assigned job
    const matchedJob = assignedJobs.find(
      (j) => j.id === targetLocationIdOrJobId || j.jobId === targetLocationIdOrJobId
    );

    if (matchedJob) {
      // If job has latitude and longitude
      const jobLat = (matchedJob as any).latitude || (matchedJob as any).lat;
      const jobLng = (matchedJob as any).longitude || (matchedJob as any).lng;

      if (jobLat && jobLng) {
        candidateTargets.push({
          id: matchedJob.id,
          name: `Job #${matchedJob.jobId || matchedJob.id} - ${matchedJob.description || 'Customer Site'}`,
          type: 'field_job',
          address: matchedJob.location || 'Customer Site',
          latitude: Number(jobLat),
          longitude: Number(jobLng),
          radiusMeters: 250, // Default 250m for job sites
          jobCode: matchedJob.jobId,
        });
      } else {
        // If job only has address or no lat/lng, we still allow field check-in as verified field site
        return {
          isValid: true,
          verificationStatus: 'verified',
          matchedLocationName: `Job #${matchedJob.jobId || matchedJob.id} - ${matchedJob.description || 'Customer Site'}`,
          matchedLocationType: 'field_job',
          distanceMeters: 0,
          allowedRadiusMeters: 250,
          accuracyMeters: currentAccuracy,
          reason: 'Job customer site check-in logged with GPS coordinates.',
        };
      }
    }
  }

  // Include office/branch locations
  for (const loc of permittedLocations.filter((l) => l.isActive !== false)) {
    candidateTargets.push({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters || 150,
    });
  }

  if (candidateTargets.length === 0) {
    // If no locations configured yet, accept as default office with warning
    return {
      isValid: true,
      verificationStatus: 'verified',
      matchedLocationName: 'Default Office Location',
      matchedLocationType: 'office',
      distanceMeters: 0,
      allowedRadiusMeters: 200,
      accuracyMeters: currentAccuracy,
      reason: 'No geofence boundaries configured yet; registered successfully.',
    };
  }

  // If a specific target location was requested, prioritize it
  let bestMatch: {
    target: VerificationTargetLocation;
    distance: number;
    withinRadius: boolean;
  } | null = null;

  if (targetLocationIdOrJobId) {
    const specific = candidateTargets.find((t) => t.id === targetLocationIdOrJobId);
    if (specific) {
      const dist = calculateHaversineDistance(
        currentLat,
        currentLng,
        specific.latitude,
        specific.longitude
      );
      bestMatch = {
        target: specific,
        distance: dist,
        withinRadius: dist <= specific.radiusMeters,
      };
    }
  }

  // If no specific match was evaluated or not found, check closest candidate
  if (!bestMatch) {
    let minDistance = Infinity;
    let closestTarget = candidateTargets[0];

    for (const target of candidateTargets) {
      const dist = calculateHaversineDistance(
        currentLat,
        currentLng,
        target.latitude,
        target.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = target;
      }
    }

    bestMatch = {
      target: closestTarget,
      distance: minDistance,
      withinRadius: minDistance <= closestTarget.radiusMeters,
    };
  }

  if (bestMatch.withinRadius) {
    if (hasAccuracyIssue) {
      return {
        isValid: true,
        verificationStatus: 'accuracy_issue',
        matchedLocationName: bestMatch.target.name,
        matchedLocationType: bestMatch.target.type,
        distanceMeters: bestMatch.distance,
        allowedRadiusMeters: bestMatch.target.radiusMeters,
        accuracyMeters: currentAccuracy,
        reason: `Inside permitted radius (${formatDistance(bestMatch.distance)} <= ${formatDistance(bestMatch.target.radiusMeters)}), but GPS accuracy is ${currentAccuracy}m.`,
      };
    }

    return {
      isValid: true,
      verificationStatus: 'verified',
      matchedLocationName: bestMatch.target.name,
      matchedLocationType: bestMatch.target.type,
      distanceMeters: bestMatch.distance,
      allowedRadiusMeters: bestMatch.target.radiusMeters,
      accuracyMeters: currentAccuracy,
      reason: `Verified at ${bestMatch.target.name} (${formatDistance(bestMatch.distance)} away, allowed: ${bestMatch.target.radiusMeters}m).`,
    };
  }

  // Outside permitted radius
  return {
    isValid: false,
    verificationStatus: 'failed',
    matchedLocationName: bestMatch.target.name,
    matchedLocationType: bestMatch.target.type,
    distanceMeters: bestMatch.distance,
    allowedRadiusMeters: bestMatch.target.radiusMeters,
    accuracyMeters: currentAccuracy,
    reason: `You are outside the permitted attendance location (${formatDistance(bestMatch.distance)} away from ${bestMatch.target.name}, allowed radius is ${bestMatch.target.radiusMeters}m).`,
  };
}

/**
 * Calculates whether check-in time is on-time, late, or grace period.
 */
export function evaluatePunctuality(
  checkInDate: Date,
  rules: AttendanceWorkingRules
): {
  isLate: boolean;
  lateMinutes: number;
  status: 'present' | 'late';
} {
  const [startHour, startMinute] = (rules.workStartTime || '09:30').split(':').map(Number);
  const scheduledStartTime = new Date(checkInDate);
  scheduledStartTime.setHours(startHour, startMinute, 0, 0);

  const graceMinutes = rules.gracePeriodMinutes || 15;
  const graceThresholdTime = new Date(
    scheduledStartTime.getTime() + graceMinutes * 60 * 1000
  );

  if (checkInDate.getTime() > graceThresholdTime.getTime()) {
    const diffMs = checkInDate.getTime() - scheduledStartTime.getTime();
    const lateMinutes = Math.floor(diffMs / (1000 * 60));
    return {
      isLate: true,
      lateMinutes,
      status: 'late',
    };
  }

  return {
    isLate: false,
    lateMinutes: 0,
    status: 'present',
  };
}

/**
 * Default Attendance Rules for any newly setup business
 */
export const DEFAULT_ATTENDANCE_RULES: AttendanceWorkingRules = {
  workStartTime: '09:30',
  workEndTime: '18:30',
  gracePeriodMinutes: 15,
  lateThresholdMinutes: 15,
  halfDayThresholdMinutes: 240, // 4 hours
  minimumWorkingHours: 8,
  allowFieldJobCheckIn: true,
  requireGPSVerification: true,
  maxAllowedGpsAccuracyMeters: 200,
  weeklyOffDays: [0], // Sunday
};
