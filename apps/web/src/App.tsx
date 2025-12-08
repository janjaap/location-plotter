import './App.css';
import { DisconnectionWarning } from './components/DisconnectionWarning/DisconnectionWarning';
import { MapCanvas } from './components/MapCanvas/MapCanvas';

import { ParamsForm } from './components/ParamsForm/ParamsForm';
import { ParamsProvider } from './providers/ParamsProvider/ParamsProvider';

function App() {
  // useEffect(() => {
  //   const preventContextMenu = (event: MouseEvent) => {
  //     event.preventDefault();
  //     return false;
  //   };

  //   document.addEventListener('contextmenu', preventContextMenu);

  //   return () => {
  //     document.removeEventListener('contextmenu', preventContextMenu);
  //   };
  // }, []);

  return (
    <main>
      <DisconnectionWarning />
      <ParamsProvider>
        <ParamsForm />

        <MapCanvas />
      </ParamsProvider>
    </main>
  );
}

export default App;
