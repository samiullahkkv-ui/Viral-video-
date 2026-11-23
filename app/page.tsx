"use client";
import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Youtube, Sparkles, Search, UploadCloud, Link2, LogOut, ShieldCheck, Clock3, ExternalLink, Video, Radio, FileText, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Connection = { channel_id: string; channel_title: string; channel_thumbnail: string | null; connected_at: string };
type Upload = { id: string; youtube_video_id: string; title: string; privacy_status: string; created_at: string };
export default function Home() {
  const supabase = createClient();
  const [email,setEmail] = useState("");
  const [user,setUser] = useState<string|null>(null);
  const [loading,setLoading] = useState(true);
  const [sending,setSending] = useState(false);
  const [connection,setConnection] = useState<Connection|null>(null);
  const [uploads,setUploads] = useState<Upload[]>([]);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");
  const [tags,setTags] = useState("");
  const [privacy,setPrivacy] = useState("private");
  const [video,setVideo] = useState<File|null>(null);
  const [uploading,setUploading] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user?.email || null);
    if (user) {
      const res = await fetch("/api/youtube/status");
      const data = await res.json();
      setConnection(data.connection || null);
      setUploads(data.uploads || []);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { load(); });
    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube_error")) setError(params.get("youtube_error")!);
    if (params.get("auth") === "error") setError("Sign-in link could not be verified. Please try again.");
    return () => subscription.unsubscribe();
  }, []);
  async function signIn(e: FormEvent) {
    e.preventDefault(); setSending(true); setError(""); setNotice("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/auth/callback" } });
    setSending(false);
    if (error) setError(error.message); else setNotice("Sign-in link sent. Check your email inbox.");
  }
  async function signOut() { await supabase.auth.signOut(); setUser(null); setConnection(null); setUploads([]); }
  async function upload(e: FormEvent) {
    e.preventDefault(); if (!video) { setError("Select a video file first."); return; }
    setUploading(true); setError(""); setNotice("");
    const form = new FormData(); form.append("video",video); form.append("title",title); form.append("description",description); form.append("tags",tags); form.append("privacyStatus",privacy);
    try {
      const res = await fetch("/api/youtube/upload",{method:"POST",body:form});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setNotice("Video uploaded successfully. YouTube link: " + data.url);
      setTitle(""); setDescription(""); setTags(""); setVideo(null);
      const input = document.getElementById("video-file") as HTMLInputElement|null; if(input) input.value="";
      await load();
    } catch(err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(false); }
  }
  if (loading) return <main className="loading"><Loader2 className="spin"/> Loading Sami Social AI…</main>;
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={21}/></div><div><b>SAMI SOCIAL</b><small>AI STUDIO</small></div></div>
      <div className="workspace"><span className="live-dot"/> WORKSPACE <span className="plan">STARTER</span></div>
      <nav><a className="active"><Radio size={17}/> Overview</a><a href="#youtube"><Youtube size={17}/> YouTube Studio</a><a href="#ideas"><TrendingUp size={17}/> Trend Research <span className="soon">NEXT</span></a><a href="#publish"><UploadCloud size={17}/> Publisher</a><a href="#history"><Clock3 size={17}/> Upload History</a></nav>
      <div className="sidebar-bottom"><div className="secure"><ShieldCheck size={16}/><span>Private workspace<br/><small>Your tokens are encrypted</small></span></div>{user && <button className="signout" onClick={signOut}><LogOut size={16}/> Sign out</button>}</div>
    </aside>
    <section className="main">
      <header className="topbar"><div><span className="eyebrow">CONTENT OPERATIONS / YOUTUBE</span><h1>Creator dashboard</h1></div><div className="top-actions">{user ? <span className="user-pill">{user}</span> : <span className="user-pill">Not signed in</span>}<span className="avatar">S</span></div></header>
      {error && <div className="alert error"><AlertCircle size={17}/>{error}<button onClick={()=>setError("")}>×</button></div>}
      {notice && <div className="alert success"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}>×</button></div>}
      {!user ? <section className="login-card"><div className="login-icon"><Sparkles/></div><span className="eyebrow">YOUR CONTENT HQ</span><h2>One workspace.<br/><em>Better videos.</em></h2><p>Sign in with your email to connect your YouTube channel and publish videos from one secure dashboard.</p><form onSubmit={signIn} className="login-form"><label>Email address</label><input type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary" disabled={sending}>{sending?<Loader2 className="spin"/>:"Send secure sign-in link"} <span>→</span></button></form><small className="muted">Password-free sign-in powered by Supabase Auth.</small></section> :
      <>
        <section className="hero"><div className="hero-copy"><span className="hero-label"><span className="live-dot"/> YOUTUBE WORKSPACE</span><h2>Make your next<br/><em>video count.</em></h2><p>Connect your channel, prepare metadata and publish your videos without leaving your studio.</p><a className="hero-link" href="#publish">Go to publisher <span>↗</span></a></div><div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="yt-tile"><Youtube size={46}/></div><div className="floating-card"><span className="live-dot"/> YOUTUBE API <b>READY TO CONNECT</b></div></div></section>
        <section className="stats"><div className="stat"><span>CONNECTED CHANNEL</span><b>{connection ? "01" : "00"}</b><small>{connection ? "Channel linked" : "Not connected"}</small></div><div className="stat"><span>VIDEOS PUBLISHED</span><b>{uploads.length.toString().padStart(2,"0")}</b><small>From this workspace</small></div><div className="stat"><span>AI TREND RESEARCH</span><b>—</b><small>Coming in next phase</small></div></section>
        <section className="section" id="youtube"><div className="section-head"><div><span className="eyebrow">01 / CHANNEL CONNECTION</span><h2>YouTube account</h2></div><span className={connection?"status connected":"status"}>{connection?"● CONNECTED":"○ NOT CONNECTED"}</span></div>
          {connection ? <div className="channel-card"><div className="channel-avatar">{connection.channel_thumbnail?<img src={connection.channel_thumbnail} alt="Channel"/>:<Youtube/>}</div><div className="channel-info"><b>{connection.channel_title}</b><span>Channel ID: {connection.channel_id}</span><small>Connected {new Date(connection.connected_at).toLocaleDateString()}</small></div><button className="outline danger" onClick={async()=>{await fetch("/api/youtube/disconnect",{method:"POST"});await load();}}>Disconnect</button></div> :
          <div className="connect-card"><div className="connect-icon"><Youtube size={27}/></div><div className="connect-info"><b>Connect your YouTube channel</b><p>Authorize with Google to read your channel and upload videos. Your account access is stored encrypted.</p></div><a className="primary compact" href="/api/youtube/connect"><Link2 size={16}/> Connect YouTube</a></div>}
        </section>
        <section className="section" id="publish"><div className="section-head"><div><span className="eyebrow">02 / PUBLISH CONTENT</span><h2>Upload a video</h2></div><span className="muted">Up to 64 MB · MP4 recommended</span></div>
          {!connection ? <div className="empty"><Youtube size={26}/><b>Connect YouTube first</b><p>After connecting your channel, you can publish a video here.</p></div> :
          <form className="upload-form" onSubmit={upload}><div className="form-grid"><div className="field full"><label>VIDEO FILE</label><input id="video-file" type="file" accept="video/*" required onChange={e=>setVideo(e.target.files?.[0]||null)}/>{video&&<small>{video.name} · {(video.size/1024/1024).toFixed(1)} MB</small>}</div><div className="field full"><label>VIDEO TITLE</label><input required maxLength={100} placeholder="Write a clear, searchable title" value={title} onChange={e=>setTitle(e.target.value)}/></div><div className="field full"><label>DESCRIPTION</label><textarea rows={4} placeholder="Tell viewers what this video is about…" value={description} onChange={e=>setDescription(e.target.value)}/></div><div className="field"><label>TAGS · COMMA SEPARATED</label><input placeholder="AI tools, technology, tutorial" value={tags} onChange={e=>setTags(e.target.value)}/></div><div className="field"><label>VISIBILITY</label><select value={privacy} onChange={e=>setPrivacy(e.target.value)}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></div></div><button className="primary" disabled={uploading}>{uploading?<><Loader2 className="spin"/> Uploading…</>:<><UploadCloud size={17}/> Upload to YouTube</>}</button><p className="muted tiny">Public videos are visible to everyone. Choose Private to test safely.</p></form>}
        </section>
        <section className="section" id="ideas"><div className="section-head"><div><span className="eyebrow">03 / NEXT MODULE</span><h2>Trending topic research</h2></div><span className="status planned">IN DEVELOPMENT</span></div><div className="next-card"><div className="next-icon"><Search size={23}/></div><div><b>Find one strong topic every day</b><p>Next phase: discover rising AI & technology topics, compare search interest, then draft a script and YouTube metadata for your approval.</p></div><span className="next-number">02</span></div></section>
        <section className="section" id="history"><div className="section-head"><div><span className="eyebrow">04 / YOUR CONTENT</span><h2>Recent uploads</h2></div></div>{uploads.length ? <div className="history">{uploads.map(item=><div className="history-row" key={item.id}><div className="history-icon"><Video size={18}/></div><div className="history-title"><b>{item.title}</b><small>{new Date(item.created_at).toLocaleString()}</small></div><span className="privacy">{item.privacy_status}</span><a href={"https://youtube.com/watch?v="+item.youtube_video_id} target="_blank" rel="noreferrer"><ExternalLink size={16}/></a></div>)}</div>:<div className="empty"><FileText size={24}/><b>No uploads yet</b><p>Your published videos will appear here.</p></div>}</section>
      </>}
      <footer>© 2026 SAMI SOCIAL AI <span>BUILT FOR CREATORS · YOUTUBE FIRST</span></footer>
    </section>
  </main>;
}