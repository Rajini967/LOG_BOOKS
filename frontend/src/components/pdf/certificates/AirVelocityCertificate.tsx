import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFCertificate } from '../PDFCertificate';
import { PDFTable } from '../PDFTable';
import { AirVelocityTestData } from '@/types/test-certificates';
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
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    minHeight: 18,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottom: '2 solid #000',
  },
  tableHeaderTop: {
    backgroundColor: '#e0e7ff',
    fontWeight: 'bold',
    borderBottom: '1 solid #000',
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    borderRight: '1 solid #ddd',
    borderBottom: '1 solid #ddd',
  },
  tableCellLast: {
    borderRight: 'none',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  roomHeader: {
    backgroundColor: '#e0e0e0',
    padding: 5,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: 9,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 10,
    padding: 5,
    backgroundColor: '#f5f5f5',
  },
  summaryLabel: {
    fontWeight: 'bold',
    width: '40%',
  },
  summaryValue: {
    width: '60%',
  },
});

interface AirVelocityCertificateProps {
  data: AirVelocityTestData;
}

export function AirVelocityCertificate({ data }: AirVelocityCertificateProps) {
  // Build table data for all rooms
  const allTableData: (string | number)[][] = [];

  data.rooms.forEach((room) => {
    room.filters.forEach((filter, filterIndex) => {
      const row: (string | number)[] = [
        // Room Name - only show on first filter of each room
        filterIndex === 0 ? room.roomName : '',
        // Room Number - only show on first filter of each room
        filterIndex === 0 ? (room.roomNumber || '') : '',
        filter.filterId,
        filter.filterArea,
        filter.readings[0],
        filter.readings[1],
        filter.readings[2],
        filter.readings[3],
        filter.readings[4],
        roundToDecimal(filter.avgVelocity, 1),
        roundToDecimal(filter.airFlowCFM, 1),
        // Total Air Flow CFM, Room Volume CFT, ACPH, and Design ACPH - only on first filter
        filterIndex === 0 ? roundToDecimal(room.totalAirFlowCFM, 1) : '',
        filterIndex === 0 ? room.roomVolumeCFT : '',
        filterIndex === 0 ? roundToDecimal(room.ach, 1) : '',
        filterIndex === 0 ? (room.designACPH !== undefined ? roundToDecimal(room.designACPH, 1) : '') : '',
      ];
      allTableData.push(row);
    });
  });

  // Column widths (in percentage)
  const columnWidths = [18, 12, 18, 8, 4, 4, 4, 4, 4, 9, 8, 9, 8, 6, 6];
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  const getCellStyle = (colIndex: number, isHeader: boolean = false) => {
    const width = (columnWidths[colIndex] / totalWidth) * 100;
    const baseStyle: any = {
      ...styles.tableCell,
      width: `${width}%`,
    };

    if (isHeader) {
      baseStyle.fontWeight = 'bold';
    }

    // Right align numeric columns
    const rightAlignCols = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    if (rightAlignCols.includes(colIndex)) {
      baseStyle.textAlign = 'right';
    }

    if (colIndex === columnWidths.length - 1) {
      baseStyle.borderRight = 'none';
    }

    return baseStyle;
  };

  return (
    <PDFCertificate
      title="To Determine The Average Air Velocity & Air Changes Per Hour"
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
        <View style={styles.table}>
          {/* Top Header Row - with "Velocity Readings in FPM" spanning columns 4-8 */}
          <View style={[styles.tableRow, styles.tableHeaderTop]}>
            <Text style={getCellStyle(0, true)}>Room Name</Text>
            <Text style={getCellStyle(1, true)}>Room Number</Text>
            <Text style={getCellStyle(2, true)}>Grill/Filter Reference No.</Text>
            <Text style={getCellStyle(3, true)}>Filter Area (Sq. ft)</Text>
            <Text style={{
              width: `${((columnWidths[4] + columnWidths[5] + columnWidths[6] + columnWidths[7] + columnWidths[8]) / totalWidth) * 100}%`,
              padding: 4,
              fontSize: 7,
              borderRight: '1 solid #ddd',
              borderBottom: '1 solid #000',
              backgroundColor: '#e0e7ff',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              Velocity Readings in FPM
            </Text>
            <Text style={getCellStyle(9, true)}>Avg Velocity FPM</Text>
            <Text style={getCellStyle(10, true)}>Air Flow CFM</Text>
            <Text style={getCellStyle(11, true)}>Total Air Flow CFM</Text>
            <Text style={getCellStyle(12, true)}>Room Volume CFT</Text>
            <Text style={getCellStyle(13, true)}>ACPH</Text>
            <Text style={getCellStyle(14, true)}>Design ACPH</Text>
          </View>
          
          {/* Second Header Row - with sub-headers 1, 2, 3, 4, 5 under "Velocity Readings in FPM" */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={getCellStyle(0, true)}> </Text>
            <Text style={getCellStyle(1, true)}> </Text>
            <Text style={getCellStyle(2, true)}> </Text>
            <Text style={getCellStyle(3, true)}> </Text>
            <Text style={[getCellStyle(4, true), styles.textCenter]}>1</Text>
            <Text style={[getCellStyle(5, true), styles.textCenter]}>2</Text>
            <Text style={[getCellStyle(6, true), styles.textCenter]}>3</Text>
            <Text style={[getCellStyle(7, true), styles.textCenter]}>4</Text>
            <Text style={[getCellStyle(8, true), styles.textCenter]}>5</Text>
            <Text style={getCellStyle(9, true)}> </Text>
            <Text style={getCellStyle(10, true)}> </Text>
            <Text style={getCellStyle(11, true)}> </Text>
            <Text style={getCellStyle(12, true)}> </Text>
            <Text style={getCellStyle(13, true)}> </Text>
            <Text style={getCellStyle(14, true)}> </Text>
          </View>

          {/* Data Rows */}
          {allTableData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {row.map((cell, colIndex) => (
                <Text key={colIndex} style={getCellStyle(colIndex)}>
                  {cell === '' ? ' ' : String(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    </PDFCertificate>
  );
}

