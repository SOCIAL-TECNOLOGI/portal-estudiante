import { useState, useEffect } from 'react';
import { auth } from '../firebase';

const PMAP_API = 'https://motor1.alau.fedusocial.org';

export function usePmap(uid) {
  const [pmap, setPmap] = useState(null);
  const [loadingPmap, setLoadingPmap] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoadingPmap(true);

    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const resp = await fetch(`${PMAP_API}/api/pmap/estudiante/${uid}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!cancelled) setPmap(data);
      } catch (e) {
        console.error('usePmap error:', e.message);
      } finally {
        if (!cancelled) setLoadingPmap(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  return { pmap, loadingPmap };
}
