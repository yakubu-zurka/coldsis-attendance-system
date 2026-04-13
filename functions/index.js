const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.validateAttendance = functions.database
  .ref('/attendance/{recordId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.val() || {};

    // Office config: prefer functions config, fallback to defaults
    const cfg = functions.config && functions.config().office ? functions.config().office : {};
    const OFFICE_LAT = Number(cfg.lat) || 5.697796;
    const OFFICE_LNG = Number(cfg.lng) || -0.176180;
    const ALLOWED_RADIUS_METERS = Number(cfg.radius) || 100;

    const latitude = Number(data.latitude || data.lat || 0);
    const longitude = Number(data.longitude || data.lng || 0);
    const accuracy = Number(data.accuracy || 0);

    const distance = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
    const effectiveDistance = Math.max(0, distance - (accuracy || 0));

    const updates = {
      serverDistance: Math.round(distance),
      serverEffectiveDistance: Math.round(effectiveDistance),
      serverValidated: false,
      validationMessage: '',
    };

    if (!latitude || !longitude) {
      updates.validationMessage = 'Missing coordinates.';
      await snapshot.ref.update(updates);
      console.log('Attendance validation failed: missing coords', context.params.recordId);
      return null;
    }

    if (accuracy > 200) {
      updates.validationMessage = `Low GPS accuracy (${accuracy}m).`;
      await snapshot.ref.update(updates);
      console.log('Attendance validation failed: low accuracy', context.params.recordId, accuracy);
      return null;
    }

    if (effectiveDistance > ALLOWED_RADIUS_METERS) {
      updates.validationMessage = `Outside allowed radius (${Math.round(distance)}m).`;
      await snapshot.ref.update(updates);
      console.log('Attendance validation failed: too far', context.params.recordId, Math.round(distance));
      return null;
    }

    // Passed validation
    updates.serverValidated = true;
    updates.validationMessage = 'OK';
    await snapshot.ref.update(updates);
    console.log('Attendance validated:', context.params.recordId, updates.serverDistance);
    return null;
  });
