import { Triangle } from 'react-loader-spinner'
import { ProgressBar } from 'react-bootstrap';

const Loader = ({ visible = true, message = "Cargando, por favor espere...", ShowProgress = false, progress = 0 }) => {
  if (!visible) return null

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(2px)',
  }

  const spinnerContainer = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  }

  const messageStyle = {
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
  }

  return (
    <div style={overlayStyle}>
      <div style={spinnerContainer}>
        <Triangle
          visible={true}
          height="80"
          width="80"
          color="#ffffff"
          ariaLabel="triangle-loading"
          wrapperStyle={{}}
          wrapperClass=""
        />
        <span style={messageStyle}>{message}</span>        
        {ShowProgress && <div style={{ width: '100%', maxWidth: '400px' }}><ProgressBar now={progress} label={`${Math.round(progress)}%`} /></div>}          
      </div>
    </div>
  )
}

export default Loader