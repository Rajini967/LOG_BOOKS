import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFCertificate } from '../PDFCertificate';
import { PDFTable } from '../PDFTable';
import { FilterIntegrityTestData } from '@/types/test-certificates';
import { roundToDecimal } from '@/lib/test-calculations';

// Format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateForPDF(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  tableContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
});

interface FilterIntegrityCertificateProps {
  data: FilterIntegrityTestData;
}

export function FilterIntegrityCertificate({ data }: FilterIntegrityCertificateProps) {
  // Build table data for all rooms
  const allTableData: (string | number)[][] = [];

  data.rooms.forEach((room) => {
    room.filters.forEach((filter, filterIndex) => {
      // Use downstreamConcentration if available, otherwise use aerosolConcentration
      const downstreamValue = filter.downstreamConcentration > 0 
        ? filter.downstreamConcentration 
        : filter.aerosolConcentration;
      
      const row: (string | number)[] = [
        // Room Name - only show on first filter of each room
        filterIndex === 0 ? room.roomName : '',
        // Room Number - only show on first filter of each room
        filterIndex === 0 ? (room.roomNumber || '') : '',
        filter.filterId,
        filter.upstreamConcentration, // in %
        downstreamValue, // Aerosol Concentration (downstream) in µg/litre
        roundToDecimal(filter.downstreamLeakage, 4), // %Leakage
        `${filter.acceptableLimit}%`, // Acceptable Limit
        filter.testStatus, // PASS/FAIL
      ];
      allTableData.push(row);
    });
  });

  const headers = [
    'Room Name',
    'Room Number',
    'Filter/Grill Id no',
    'Upstream Concentration in (%)',
    'Aerosol Concentration in (20 to 80 µg/litre)',
    'Obtained Results in Downstream (%Leakage)',
    'Acceptable Limit in Downstream (%Leakage)',
    'Test Status',
  ];

  const columnWidths = [16, 12, 20, 12, 15, 12, 12, 11];

  return (
    <PDFCertificate
      title="HEPA Filter Integrity Test"
      clientInfo={data.clientInfo}
      certificateNo={data.certificateNo}
      date={formatDateForPDF(data.date)}
      testReference={data.testReference}
      instrument={data.instrument}
      ahuNumber={data.ahuNumber}
      inference={data.inference}
      preparedBy={data.preparedBy}
      approvedBy={data.approvedBy}
    >
      <View style={styles.tableContainer}>
        <PDFTable
          headers={headers}
          data={allTableData}
          columnWidths={columnWidths}
          alignCenter={[7]}
          alignRight={[3, 4, 5]}
        />
      </View>
    </PDFCertificate>
  );
}

