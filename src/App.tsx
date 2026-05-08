import { CareWorkspace } from './features/care-plan/CareWorkspace'

type AppProps = {
  version: string
  commit: string
}

function App({ version, commit }: AppProps) {
  return <CareWorkspace version={version} commit={commit} />
}

export default App
