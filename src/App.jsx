import { useState, useRef, useEffect } from 'react';

export default function CameraApp() {
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Erreur d\'accès à la caméra: ' + err.message);
      console.error('Erreur:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg');
      setPhoto(photoData);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (facingMode && !stream) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Test Caméra</h1>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div style={styles.videoContainer}>
            {!photo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={styles.video}
              />
            ) : (
              <img src={photo} alt="Photo prise" style={styles.photo} />
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={styles.buttonGroup}>
            {!stream ? (
              <button
                onClick={startCamera}
                style={styles.buttonPrimary}
              >
                Démarrer la caméra
              </button>
            ) : (
              <>
                {!photo ? (
                  <>
                    <button
                      onClick={takePhoto}
                      style={styles.buttonSuccess}
                    >
                      Prendre une photo
                    </button>
                    <button
                      onClick={switchCamera}
                      style={styles.buttonSecondary}
                      title="Changer de caméra"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={stopCamera}
                      style={styles.buttonDanger}
                    >
                      Stop
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setPhoto(null)}
                      style={styles.buttonPrimary}
                    >
                      Nouvelle photo
                    </button>
                    <a
                      href={photo}
                      download="photo.jpg"
                      style={styles.buttonSuccess}
                    >
                      Télécharger
                    </a>
                  </>
                )}
              </>
            )}
          </div>

          <div style={styles.info}>
            <p style={styles.infoTitle}>Note du dév:</p>
            <p style={styles.infoText}>
              Pitié, j'ai pas envie de faire du style en React Native.
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
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '28rem',
    backgroundColor: '#1f2937',
    borderRadius: '0.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
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
  videoContainer: {
    position: 'relative',
    backgroundColor: 'black',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    marginBottom: '1rem',
  },
  video: {
    width: '100%',
    height: 'auto',
    minHeight: '300px',
    display: 'block',
  },
  photo: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
  },
  buttonBase: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
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
    textDecoration: 'none',
    display: 'inline-block',
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
  buttonDanger: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
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
    marginBottom: '0.25rem',
  },
  infoText: {
    fontSize: '0.875rem',
    color: '#d1d5db',
    margin: 0,
  },
};