import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({children}) {
  const [user,setUser] = useState(null);
  const [profile,setProfile] = useState(null);
  const [profileError,setProfileError] = useState('');
  const [checking,setChecking] = useState(true);
  useEffect(()=>{ api('/auth/me').then(data=>setUser(data.user)).catch(()=>setUser(null)).finally(()=>setChecking(false)); },[]);
  useEffect(()=>{const expired=()=>setUser(null);window.addEventListener('balanceboard:session-expired',expired);return ()=>window.removeEventListener('balanceboard:session-expired',expired);},[]);
  useEffect(()=>{
    setProfile(null); setProfileError('');
    if(!user) return;
    let cancelled=false;
    api('/profile').then(data=>{if(!cancelled) setProfile(data);}).catch(e=>{if(!cancelled) setProfileError(e.message);});
    return ()=>{cancelled=true;};
  },[user?.id]);
  async function authenticate(mode,username,password) {
    const data=await api(`/auth/${mode}`,{method:'POST',body:JSON.stringify({username,password})});
    setUser(data.user);
  }
  async function logout() { await api('/auth/logout',{method:'POST'}); setUser(null); }
  async function saveProfile(data) { const saved=await api('/profile',{method:'PATCH',body:JSON.stringify(data)}); setProfile(saved); return saved; }
  async function reloadProfile() { setProfileError(''); try {setProfile(await api('/profile'));} catch(e) {setProfileError(e.message);} }
  async function changePassword(currentPassword,newPassword) { return api('/profile/password',{method:'PATCH',body:JSON.stringify({currentPassword,newPassword})}); }
  return <AuthContext.Provider value={{user,profile,profileError,checking,authenticate,logout,saveProfile,reloadProfile,changePassword}}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
