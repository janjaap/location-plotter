import './App.css';
import { LiveTrack } from './components/LiveTrack/LiveTrack';
import { clientSocket } from './lib/clientSocket';

import { ParamsForm } from './components/ParamsForm/ParamsForm';

function App() {
  clientSocket.onAnyOutgoing((event, ...args) => {
    console.log(`Outgoing: ${event}`, args);
  });

  return (
    <main>
      <ParamsForm />

      <LiveTrack />
    </main>
  );
}

export default App;
