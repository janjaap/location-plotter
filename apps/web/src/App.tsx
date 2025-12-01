import './App.css';
import { DisconnectionWarning } from './components/DisconnectionWarning/DisconnectionWarning';
import { MapCanvas } from './components/MapCanvas/MapCanvas';

import { ParamsForm } from './components/ParamsForm/ParamsForm';
import { ParamsProvider } from './providers/ParamsProvider/ParamsProvider';

function App() {
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
