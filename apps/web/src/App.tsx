import './App.css';
import { LiveTrack } from './components/LiveTrack/LiveTrack';

import { ParamsForm } from './components/ParamsForm/ParamsForm';
import { ZoomProvider } from './providers/ZoomProvider/ZoomProvider';

function App() {
  return (
    <main>
      <ZoomProvider>
        <ParamsForm />

        <LiveTrack />
      </ZoomProvider>
    </main>
  );
}

export default App;
