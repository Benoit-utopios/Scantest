import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]);
  const [lastCode, setLastCode] = useState('');
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScanTime = useRef(0);

  useEffect(() => {
    // Récupérer la liste des caméras disponibles
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // Priorité à la caméra arrière (environment)
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arrière'));
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error('Erreur récupération caméras:', err);
      setError('Impossible de lister les caméras');
    });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!selectedCamera) {
      setError('Aucune caméra sélectionnée');
      return;
    }

    try {
      setError('');
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.777778
        },
        onScanSuccess,
        onScanError
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Erreur démarrage scanner:', err);
      setError('Erreur de démarrage: ' + err);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    const now = Date.now();
    
    // Debounce: éviter les scans multiples (2 secondes)
    if (decodedText !== lastCode || now - lastScanTime.current > 2000) {
      setLastCode(decodedText);
      lastScanTime.current = now;

      const newScan = {
        data: decodedText,
        format: decodedResult.result?.format?.formatName || 'UNKNOWN',
        timestamp: new Date().toLocaleString('fr-FR'),
      };
      
      setScannedCodes(prev => [newScan, ...prev]);
      
      // Feedback
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      // Flash visuel
      const reader = document.getElementById('barcode-reader');
      if (reader) {
        reader.style.border = '4px solid #10b981';
        setTimeout(() => {
          reader.style.border = '4px solid transparent';
        }, 300);
      }
    }
  };

  const onScanError = (errorMessage) => {
    // Ignorer les erreurs de scan normales (aucun code détecté)
    // console.log('Scan error:', errorMessage);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Erreur arrêt scanner:', err);
      }
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCamera(cameras[nextIndex].id);
    }
  };

  useEffect(() => {
    if (selectedCamera && !scanning) {
      // Auto-démarrage désactivé, l'utilisateur doit cliquer
    }
  }, [selectedCamera]);

  const clearHistory = () => {
    setScannedCodes([]);
    setLastCode('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Code copié !');
    }).catch(err => {
      console.error('Erreur copie:', err);
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Scanner de Code-Barres</h1>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div 
            id="barcode-reader"
            ref={scannerRef}
            style={{
              ...styles.scannerContainer,
              border: '4px solid transparent',
              transition: 'border 0.3s'
            }}
          />

          <div style={styles.buttonGroup}>
            {!scanning ? (
              <button
                onClick={startScanner}
                style={styles.buttonSuccess}
                disabled={!selectedCamera}
              >
                Démarrer le scan
              </button>
            ) : (
              <>
                <button
                  onClick={stopScanner}
                  style={styles.buttonWarning}
                >
                  Arrêter
                </button>
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    style={styles.buttonSecondary}
                    title="Changer de caméra"
                  >
                    Refresh
                  </button>
                )}
              </>
            )}
          </div>

          {scannedCodes.length > 0 && (
            <div style={styles.resultsSection}>
              <div style={styles.resultsHeader}>
                <h2 style={styles.resultsTitle}>
                  Codes scannés ({scannedCodes.length})
                </h2>
                <button
                  onClick={clearHistory}
                  style={styles.buttonClear}
                >
                  Effacer
                </button>
              </div>
              
              <div style={styles.resultsList}>
                {scannedCodes.map((scan, index) => (
                  <div key={index} style={styles.resultItem}>
                    <div style={styles.resultData}>
                      <strong style={styles.resultCode}>{scan.data}</strong>
                      <div style={styles.resultMeta}>
                        <span style={styles.resultFormat}>{scan.format}</span>
                        <span style={styles.resultTime}>{scan.timestamp}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(scan.data)}
                      style={styles.buttonCopy}
                      title="Copier"
                    >
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.info}>
            <p style={styles.infoTitle}>Conseils pour un bon scan:</p>
            <ul style={styles.infoList}>
              <li><strong>Éclairage:</strong> Bon éclairage uniforme obligatoire</li>
              <li><strong>Distance:</strong> 15-25cm de la caméra</li>
              <li><strong>Stabilité:</strong> Maintenez stable 1-2 secondes</li>
              <li><strong>Zone verte:</strong> Placez le code dans le cadre vert</li>
              <li><strong>Orientation:</strong> Code-barres horizontal de préférence</li>
            </ul>
            <p style={styles.infoFormats}>
              <strong>Formats:</strong> EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, QR Code, Data Matrix
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '32rem',
    backgroundColor: '#1f2937',
    borderRadius: '0.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    marginTop: '1rem',
  },
  header: {
    backgroundColor: '#374151',
    padding: '1rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
  },
  content: {
    padding: '1rem',
  },
  error: {
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  },
  scannerContainer: {
    position: 'relative',
    backgroundColor: 'black',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    marginBottom: '1rem',
    minHeight: '300px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  buttonSuccess: {
    backgroundColor: '#16a34a',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  buttonWarning: {
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  buttonSecondary: {
    backgroundColor: '#4b5563',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  resultsSection: {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  resultsTitle: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
  },
  buttonClear: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  resultsList: {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  resultItem: {
    backgroundColor: '#374151',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  resultData: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  resultCode: {
    color: '#10b981',
    fontSize: '1.125rem',
    wordBreak: 'break-all',
  },
  resultMeta: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  resultFormat: {
    color: '#60a5fa',
    fontSize: '0.75rem',
    backgroundColor: '#1e3a8a',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
  },
  resultTime: {
    color: '#9ca3af',
    fontSize: '0.75rem',
  },
  buttonCopy: {
    backgroundColor: '#4b5563',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  info: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#374151',
    borderRadius: '0.5rem',
  },
  infoTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: '0.5rem',
    marginTop: 0,
  },
  infoList: {
    fontSize: '0.875rem',
    color: '#d1d5db',
    margin: '0 0 0.5rem 0',
    paddingLeft: '1.25rem',
  },
  infoFormats: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: 0,
  },
};