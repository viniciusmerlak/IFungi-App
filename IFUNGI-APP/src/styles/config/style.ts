import { StyleSheet, Dimensions, Platform } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const CARD_HEIGHT = 80;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },

  /* ---------- Header Aprimorado ---------- */
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#8c1bf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  section: {
    marginBottom: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(148, 0, 211, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
  },
  
  backButton: {
    marginRight: 14,
    padding: 6,
  },
  
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(148, 0, 211, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  gradient: {
    flex: 1,
  },
  
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  
  /* ---------- Cards Estilizados ---------- */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
    height: CARD_HEIGHT,
  },
  
  cardLabel: {
    flex: 1.5,
  },
  
  cardLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 22,
    letterSpacing: 0.4,
  },
  
  cardValueBox: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    shadowColor: '#8c1bf7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardValueText: {
    fontWeight: '800',
    color: '#000',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  /* ---------- Action Cards ---------- */
  actionCard: {
    borderWidth: 2,
    borderColor: 'rgba(148, 0, 211, 0.7)',
    marginTop: 12,
    shadowColor: '#9400d3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  /* ---------- Modal Premium ---------- */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  
  glassModal: {
    width: '88%',
    padding: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(104, 27, 228, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#8c1bf7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
  },
  
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 22,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
  },
  
  modalInput: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 22,
    borderWidth: 2,
    borderColor: 'rgba(148, 0, 211, 0.3)',
    fontWeight: '600',
  },
  
  modalButton: {
    backgroundColor: 'rgba(229, 33, 255, 0.95)',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  modalButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.6,
  },
  
  modalCancel: {
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 8,
  },
  
  blurContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContentGlass: {
    width: '88%',
    padding: 32,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 214, 245, 0.98)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#ff4fd8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 18,
      },
    }),
    alignItems: 'center',
  },
});