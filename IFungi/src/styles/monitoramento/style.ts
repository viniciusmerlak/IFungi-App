import { StyleSheet, Dimensions, Platform } from 'react-native';
//styles do monitoramento
const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

// Adicione estas styles ao seu arquivo de estilos:

chartWithYAxis: {
  flexDirection: 'row',
  alignItems: 'center',
},
yAxisContainer: {
  width: 60,
  height: 220,
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  paddingRight: 8,
  paddingVertical: 10,
},
yAxisLabel: {
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold',
  textAlign: 'right',
},
chartScrollContainer: {
  flex: 1,
},
rangeInfoContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginTop: 10,
  paddingHorizontal: 20,
},
rangeItem: {
  alignItems: 'center',
},
rangeLabel: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
  marginBottom: 2,
},
rangeValue: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  header: {
    backgroundColor: 'rgb(0, 0, 0)',
    marginBottom: 40,
    paddingVertical: 10,
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius:40,
    borderBottomRightRadius:40,
    alignItems: 'center',
    position : 'absolute',
    zIndex: 10,
  },
  heartbeatText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  headerText: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
chart: {
  marginVertical: 8,
  borderRadius: 16,
  paddingRight: 10, // Espaço extra à direita
},
  doubleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  configButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#000',
  },
  configButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },

  statusIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 5,
    left: -10,
  },

  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  ipText: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  exportButton: {
  backgroundColor: '#3B82F6',
  padding: 15,
  borderRadius: 10,
  margin: 20,
  alignItems: 'center',
},
exportButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
},
metricSelectorContainer: {
  marginTop: 15,
  marginBottom: 15,
  paddingHorizontal: 10,
},
metricOption: {
  paddingHorizontal: 15,
  paddingVertical: 8,
  marginRight: 10,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
},
metricOptionSelected: {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
},
metricOptionText: {
  color: 'white',
  fontSize: 14,
},
metricOptionTextSelected: {
  fontWeight: 'bold',
},
noDataContainer: {
  height: 210,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 16,
},

noDataText: {
  color: '#fff',
  fontSize: 16,
  textAlign: 'center',
},
errorContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
errorText: {
  color: '#fff',
  fontSize: 18,
  textAlign: 'center',
  marginBottom: 20,
  fontWeight: 'bold',
},
errorButton: {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingVertical: 15,
  paddingHorizontal: 30,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#fff',
},
errorButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},

chartScrollView: {
  maxHeight: 230,
  borderRadius: 16,
  marginHorizontal: 10,
},

chartContentContainer: {
  paddingRight: 20,
  minWidth: screenWidth,
},
chartHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
currentValue: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  backgroundColor: 'rgba(255,255,255,0.2)',
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 10,
},

  heartbeatContainer: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
chartWrapper: {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  padding: 10,
  marginBottom: 10,
},

chartHint: {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 12,
  textAlign: 'center',
  marginTop: 8,
  fontStyle: 'italic',
},

clearButton: {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: 10,
  borderRadius: 8,
  alignSelf: 'center',
  marginBottom: 15,
},

clearButtonText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
},
loadingSubText: {
  color: '#fff',
  fontSize: 12,
  marginTop: 5,
  opacity: 0.8,
},
noDataSubText: {
  color: '#fff',
  fontSize: 12,
  marginTop: 5,
  opacity: 0.8,
  textAlign: 'center',
},
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
  },
});
export default styles;