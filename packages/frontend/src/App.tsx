import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      /* param name now matches EditorPage */
      { path: 'editor/:danceId', element: <EditorPage /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
