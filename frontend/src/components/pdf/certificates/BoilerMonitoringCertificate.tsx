import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader } from '../PDFHeader';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #000',
    minHeight: 20,
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
    borderBottom: '2 solid #000',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    borderRight: '1 solid #000',
    textAlign: 'center',
  },
  tableCellLast: {
    borderRight: 'none',
  },
  limitRow: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  redText: {
    color: '#ff0000',
  },
  footer: {
    marginTop: 20,
    fontSize: 10,
  },
  footerLine: {
    marginBottom: 5,
  },
});

interface BoilerMonitoringData {
  logs: Array<{
    date: string;
    time: string;
    equipmentId: string;
    feedWaterTemp?: number;
    oilTemp?: number;
    steamTemp?: number;
    steamPressure?: number;
    steamFlowLPH?: number;
    remarks?: string;
    checkedBy?: string;
  }>;
}

interface BoilerMonitoringCertificateProps {
  data: BoilerMonitoringData;
}

export function BoilerMonitoringCertificate({ data }: BoilerMonitoringCertificateProps) {
  const limits = {
    feedWaterTemp: { min: 50, unit: '°C', type: 'NLT' },
    oilTemp: { min: 50, unit: '°C', type: 'NLT' },
    steamTemp: { min: 150, unit: '°C', type: 'NLT' },
    steamPressure: { min: 6, unit: 'bar', type: 'NLT' },
  };

  const checkLimit = (field: string, value: number | undefined): boolean => {
    if (value === undefined) return false;
    const limit = limits[field as keyof typeof limits];
    if (!limit) return false;
    if (limit.type === 'NMT' && limit.max !== undefined) {
      return value > limit.max;
    }
    if (limit.type === 'NLT' && limit.min !== undefined) {
      return value < limit.min;
    }
    return false;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader />
        
        <Text style={styles.title}>RAW DATA FOR BOILER MONITORING</Text>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '10%' }]}>Date</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>Time</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Feed water temp</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Oil temp</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Steam temp</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Steam Pressure</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Steam Flow LPH</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>Remarks</Text>
            <Text style={[styles.tableCell, { width: '10%' }, styles.tableCellLast]}>Checked By</Text>
          </View>

          {/* Limits Row */}
          <View style={[styles.tableRow, styles.limitRow]}>
            <Text style={[styles.tableCell, { width: '10%' }]}>Limits</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}></Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>NLT 50 °C</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>NLT 50 °C</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>NLT 150 °C</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>NLT 6 bar</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>LPH</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}></Text>
            <Text style={[styles.tableCell, { width: '10%' }, styles.tableCellLast]}></Text>
          </View>

          {/* Data Rows */}
          {data.logs.map((log, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '10%' }]}>{log.date === 'Automatic' || !log.date ? 'Automatic' : log.date}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{log.time === 'Automatic' || !log.time ? 'Automatic' : log.time}</Text>
              <Text style={[
                styles.tableCell, 
                { width: '12%' },
                checkLimit('feedWaterTemp', log.feedWaterTemp) && styles.redText
              ]}>
                {log.feedWaterTemp !== undefined ? log.feedWaterTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '12%' },
                checkLimit('oilTemp', log.oilTemp) && styles.redText
              ]}>
                {log.oilTemp !== undefined ? log.oilTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '12%' },
                checkLimit('steamTemp', log.steamTemp) && styles.redText
              ]}>
                {log.steamTemp !== undefined ? log.steamTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '12%' },
                checkLimit('steamPressure', log.steamPressure) && styles.redText
              ]}>
                {log.steamPressure !== undefined ? log.steamPressure : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {log.steamFlowLPH !== undefined ? log.steamFlowLPH : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {log.remarks || '-'}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }, styles.tableCellLast]}>
                {log.checkedBy || ''}
              </Text>
            </View>
          ))}

          {/* Empty rows for additional entries */}
          {Array.from({ length: Math.max(0, 10 - data.logs.length) }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }, styles.tableCellLast]}></Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLine}>Remarks:</Text>
          <Text style={styles.footerLine}>Digital sign</Text>
        </View>
      </Page>
    </Document>
  );
}

