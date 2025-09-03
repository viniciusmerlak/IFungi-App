import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 100,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    backgroundColor: 'rgb(0, 0, 0)',
    marginBottom: 20,
    paddingVertical: 15,
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius:40,
    borderBottomRightRadius:40,
    alignItems: 'center',
    position : 'absolute',
    zIndex: 10,
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
    borderRadius: 15,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 5,
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
// Adicione estas propriedades aos seus estilos existentes



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


});
export default styles;