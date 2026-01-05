import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
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
});

interface PDFTableProps {
  headers: string[];
  data: (string | number)[][];
  columnWidths?: number[];
  alignRight?: number[]; // Column indices to align right
  alignCenter?: number[]; // Column indices to align center
}

export function PDFTable({ 
  headers, 
  data, 
  columnWidths,
  alignRight = [],
  alignCenter = []
}: PDFTableProps) {
  const totalWidth = columnWidths?.reduce((sum, w) => sum + w, 0) || 100;
  const defaultWidth = totalWidth / headers.length;

  const getCellStyle = (colIndex: number, isHeader: boolean = false) => {
    const width = columnWidths?.[colIndex] || defaultWidth;
    const baseStyle: any = {
      ...styles.tableCell,
      width: `${width}%`,
    };

    if (isHeader) {
      baseStyle.fontWeight = 'bold';
    }

    if (alignRight.includes(colIndex)) {
      baseStyle.textAlign = 'right';
    } else if (alignCenter.includes(colIndex)) {
      baseStyle.textAlign = 'center';
    }

    if (colIndex === headers.length - 1) {
      baseStyle.borderRight = 'none';
    }

    return baseStyle;
  };

  return (
    <View style={styles.table}>
      {/* Header Row */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        {headers.map((header, index) => (
          <Text key={index} style={getCellStyle(index, true)}>
            {header}
          </Text>
        ))}
      </View>

      {/* Data Rows */}
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((cell, colIndex) => (
            <Text key={colIndex} style={getCellStyle(colIndex)}>
              {cell === '' ? ' ' : String(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

