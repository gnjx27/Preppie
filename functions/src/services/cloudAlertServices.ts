// Firebase Imports
import { db } from "../index";
import * as admin from 'firebase-admin';
// Type Imports
import { GdacsAlert, GdacsFeature } from "../cloudTypes";

/**
 * Check alert and format alert data for storage in Firestore
 * @param alert 
 * @param feature 
 * @returns docId, alertData & status (new, updated, skipped)
 */
export const checkAndPrepareAlert = async (
    alert: GdacsAlert,
    feature: GdacsFeature
) => {
    // Create alert document id from eventid and episodeid
    const docId = `${alert.eventid}-${alert.episodeid}`;
    // Create alert document ref
    const alertRef = db.collection('disasters').doc(docId);

    // Check if this alert already exists in Firestore disasters collection
    const existingDoc = await alertRef.get();
    const isNewAlert = !existingDoc.exists;

    // If alert is not new
    if (!isNewAlert) {
        return { docId, status: 'skipped' };
    }

    // Prepare Firestore-ready alert data
    const alertData = {
        // Core identification
        eventid: alert.eventid,
        episodeid: alert.episodeid,
        eventtype: alert.eventtype,

        // Display information
        name: alert.name,
        description: alert.description,
        htmldescription: alert.htmldescription,
        icon: alert.icon || null,

        // Severity information
        alertlevel: alert.alertlevel,
        alertscore: alert.alertscore,

        // Geographic data
        geometry: feature.geometry,
        bbox: feature.bbox,
        affectedcountries: alert.affectedcountries.map(country => ({
            iso2: country.iso2,
            countryname: country.countryname
        })),

        // Timing
        fromdate: admin.firestore.Timestamp.fromDate(new Date(alert.fromdate)),
        todate: admin.firestore.Timestamp.fromDate(new Date(alert.todate)),
        datemodified: admin.firestore.Timestamp.fromDate(new Date(alert.datemodified)),

        // Additional data
        severitydata: alert.severitydata,
        reportUrl: alert.url?.report || null,

        // Metadata
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        source: 'GDACS'
    }

    // Return alertData and alert status (new or updated)
    return { docId, alertData, status: 'new' };
}

/**
 * Extracts affected country codes from a GDACS alert.
 * @param alert
 * @returns an array of ISO2 country codes in uppercase.
 * 
 */
export const extractAffectedCountryCodes = (alert: GdacsAlert): string[] => {
    return alert.affectedcountries.map(country => country.iso2.toUpperCase());
}

