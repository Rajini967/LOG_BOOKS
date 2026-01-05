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
  tableCellLeft: {
    textAlign: 'left',
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

interface ChillerMonitoringData {
  logs: Array<{
    date: string;
    time: string;
    equipmentId: string;
    chillerSupplyTemp?: number;
    chillerReturnTemp?: number;
    coolingTowerSupplyTemp?: number;
    coolingTowerReturnTemp?: number;
    ctDifferentialTemp?: number;
    chillerWaterInletPressure?: number;
    chillerMakeupWaterFlow?: number;
    remarks?: string;
    checkedBy?: string;
  }>;
}

interface ChillerMonitoringCertificateProps {
  data: ChillerMonitoringData;
}

export function ChillerMonitoringCertificate({ data }: ChillerMonitoringCertificateProps) {
  const limits = {
    chillerSupplyTemp: { max: 8, unit: '°C', type: 'NMT' },
    chillerReturnTemp: { max: 15, unit: '°C', type: 'NMT' },
    coolingTowerSupplyTemp: { max: 25, unit: '°C', type: 'NMT' },
    coolingTowerReturnTemp: { max: 30, unit: '°C', type: 'NMT' },
    ctDifferentialTemp: { max: 5, unit: '°C', type: 'NMT' },
    chillerWaterInletPressure: { min: 2, unit: 'bar', type: 'NLT' },
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
        
        <Text style={styles.title}>RAW DATA FOR CHILLER MONITORING</Text>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '7%' }]}>Date</Text>
            <Text style={[styles.tableCell, { width: '7%' }]}>Time</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>Chiller supply temp</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>Chiller return temp</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>Cooling tower supply temp</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>Cooling tower Return temp</Text>
            <Text style={[styles.tableCell, { width: '9%' }]}>CT Differential temperature</Text>
            <Text style={[styles.tableCell, { width: '9%' }]}>Chiller water inlet pressure</Text>
            <Text style={[styles.tableCell, { width: '7%' }]}>Chiller make up water Flow</Text>
            <Text style={[styles.tableCell, { width: '9%' }]}>Remarks</Text>
            <Text style={[styles.tableCell, { width: '9%' }, styles.tableCellLast]}>Checked By</Text>
          </View>

          {/* Limits Row */}
          <View style={[styles.tableRow, styles.limitRow]}>
            <Text style={[styles.tableCell, { width: '7%' }]}>Limits</Text>
            <Text style={[styles.tableCell, { width: '7%' }]}></Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>NMT 8 °C</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>NMT 15 °C</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>NMT 25 °C</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>NMT 30 °C</Text>
            <Text style={[styles.tableCell, { width: '9%' }]}>NMT 5 °C</Text>
            <Text style={[styles.tableCell, { width: '9%' }]}>NLT 2 bar</Text>
            <Text style={[styles.tableCell, { width: '7%' }]}>LPH</Text>
            <Text style={[styles.tableCell, { width: '9%' }]}></Text>
            <Text style={[styles.tableCell, { width: '9%' }, styles.tableCellLast]}></Text>
          </View>

          {/* Data Rows */}
          {data.logs.map((log, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '7%' }]}>{log.date === 'Automatic' || !log.date ? 'Automatic' : log.date}</Text>
              <Text style={[styles.tableCell, { width: '7%' }]}>{log.time === 'Automatic' || !log.time ? 'Automatic' : log.time}</Text>
              <Text style={[
                styles.tableCell, 
                { width: '11%' },
                checkLimit('chillerSupplyTemp', log.chillerSupplyTemp) && styles.redText
              ]}>
                {log.chillerSupplyTemp !== undefined ? log.chillerSupplyTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '11%' },
                checkLimit('chillerReturnTemp', log.chillerReturnTemp) && styles.redText
              ]}>
                {log.chillerReturnTemp !== undefined ? log.chillerReturnTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '11%' },
                checkLimit('coolingTowerSupplyTemp', log.coolingTowerSupplyTemp) && styles.redText
              ]}>
                {log.coolingTowerSupplyTemp !== undefined ? log.coolingTowerSupplyTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '11%' },
                checkLimit('coolingTowerReturnTemp', log.coolingTowerReturnTemp) && styles.redText
              ]}>
                {log.coolingTowerReturnTemp !== undefined ? log.coolingTowerReturnTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '9%' },
                checkLimit('ctDifferentialTemp', log.ctDifferentialTemp) && styles.redText
              ]}>
                {log.ctDifferentialTemp !== undefined ? log.ctDifferentialTemp : ''}
              </Text>
              <Text style={[
                styles.tableCell, 
                { width: '9%' },
                checkLimit('chillerWaterInletPressure', log.chillerWaterInletPressure) && styles.redText
              ]}>
                {log.chillerWaterInletPressure !== undefined ? log.chillerWaterInletPressure : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '7%' }]}>
                {log.chillerMakeupWaterFlow !== undefined ? log.chillerMakeupWaterFlow : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '9%' }]}>
                {log.remarks || '-'}
              </Text>
              <Text style={[styles.tableCell, { width: '9%' }, styles.tableCellLast]}>
                {log.checkedBy || ''}
              </Text>
            </View>
          ))}

          {/* Empty rows for additional entries */}
          {Array.from({ length: Math.max(0, 10 - data.logs.length) }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '7%' }]}></Text>
              <Text style={[styles.tableCell, { width: '7%' }]}></Text>
              <Text style={[styles.tableCell, { width: '11%' }]}></Text>
              <Text style={[styles.tableCell, { width: '11%' }]}></Text>
              <Text style={[styles.tableCell, { width: '11%' }]}></Text>
              <Text style={[styles.tableCell, { width: '11%' }]}></Text>
              <Text style={[styles.tableCell, { width: '9%' }]}></Text>
              <Text style={[styles.tableCell, { width: '9%' }]}></Text>
              <Text style={[styles.tableCell, { width: '7%' }]}></Text>
              <Text style={[styles.tableCell, { width: '9%' }]}></Text>
              <Text style={[styles.tableCell, { width: '9%' }, styles.tableCellLast]}></Text>
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

