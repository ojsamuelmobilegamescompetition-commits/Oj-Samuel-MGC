/* OJ Samuel Match Centre — admin + public automatic standings */
(() => {
  const $ = (id) => document.getElementById(id);
  const ready = () => window.supabase && window.OJ_SUPABASE_URL && window.OJ_SUPABASE_ANON_KEY &&
    !String(window.OJ_SUPABASE_URL).includes('PASTE_') && !String(window.OJ_SUPABASE_ANON_KEY).includes('PASTE_');
  if (!ready()) return;
  const db = window.supabase.createClient(window.OJ_SUPABASE_URL, window.OJ_SUPABASE_ANON_KEY);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const say = (id, message, kind='') => { const el=$(id); if(!el)return; el.textContent=message; el.className='notice '+kind; el.classList.remove('hidden'); };
  const localDate = (value) => { if(!value)return ''; const d=new Date(value); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

  // ADMIN MATCH CENTRE — require a signed-in user who passes the database admin check.
  if ($('matchPanel')) {
    let players=[], matches=[], isAdmin=false;
    const guardAdmin = async () => {
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('Please sign in with your administrator account.');
      const { data, error } = await db.rpc('is_oj_admin');
      if (error) throw new Error('Admin permission check failed: ' + error.message);
      if (data !== true) throw new Error('This account is signed in but is not registered as an OJ administrator.');
      isAdmin = true;
    };
    const loadPlayers = async () => {
      const {data,error}=await db.from('registrations').select('id,full_name,gamer_tag,game,status').eq('status','approved').order('full_name');
      if(error) throw error; players=data||[];
      const options=players.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name)} — ${esc(p.gamer_tag)} (${esc(p.game||'Game')})</option>`).join('');
      ['matchPlayerOne','matchPlayerTwo'].forEach(id=>{ const s=$(id); if(s)s.innerHTML='<option value="">Select approved player</option>'+options; });
    };
    const loadMatches = async () => {
      const {data,error}=await db.from('oj_matches').select('*').order('scheduled_at',{ascending:false}).order('created_at',{ascending:false}).limit(500);
      if(error) throw error; matches=data||[]; renderMatches();
    };
    const renderMatches = () => {
      const body=$('matchRows'); if(!body)return;
      body.innerHTML=matches.length?matches.map(m=>{
        const score=m.player_one_score===null||m.player_two_score===null?'—':`${m.player_one_score} : ${m.player_two_score}`;
        const badge=m.status==='approved'?'':m.status==='rejected'?'rejected':'pending';
        const actions=m.status==='scheduled'
          ? `<button class="rowbtn" data-score="${m.id}">Enter result</button>`
          : m.status==='pending_approval'
            ? `<button class="rowbtn" data-approve="${m.id}">Approve</button><button class="rowbtn danger" data-reject="${m.id}">Reject</button><button class="rowbtn" data-score="${m.id}">Edit score</button>`
            : `<button class="rowbtn" data-score="${m.id}">Edit score</button>`;
        return `<tr><td><b>${esc(m.tournament_name)}</b><div class="muted">${esc(m.game)} · ${esc(m.round_label)}</div></td><td>${esc(m.player_one_name)}<div class="muted">${esc(m.player_one_gamer_tag)}</div></td><td>${esc(m.player_two_name)}<div class="muted">${esc(m.player_two_gamer_tag)}</div></td><td>${m.scheduled_at?esc(new Date(m.scheduled_at).toLocaleString()):'—'}</td><td><b>${score}</b></td><td><span class="badge ${badge}">${esc(m.status.replace('_',' '))}</span></td><td>${actions}<button class="rowbtn danger" data-match-delete="${m.id}">Delete</button></td></tr>`;
      }).join(''):'<tr><td colspan="7" class="empty">No matches yet. Create the first fixture above.</td></tr>';
    };
    const refresh = async () => { try { await guardAdmin(); await Promise.all([loadPlayers(),loadMatches()]); say('matchMessage',`Loaded ${matches.length} matches and ${players.length} approved players.`,'success'); } catch(e) { isAdmin=false; say('matchMessage',e.message,'error'); } };
    $('matchRefresh')?.addEventListener('click',refresh);
    $('matchCreateForm')?.addEventListener('submit',async ev=>{
      ev.preventDefault(); const f=ev.currentTarget;
      if (!isAdmin) { say('matchMessage','Administrator verification is required. Sign in again.','error'); return; }
      const one=players.find(p=>String(p.id)===f.player_one_registration_id.value), two=players.find(p=>String(p.id)===f.player_two_registration_id.value);
      if(!one||!two){say('matchMessage','Choose two approved players.','error');return;}
      if(String(one.id)===String(two.id)){say('matchMessage','A player cannot play against themselves.','error');return;}
      const payload={tournament_name:f.tournament_name.value.trim(),game:f.game.value.trim()||'eFootball',round_label:f.round_label.value.trim()||'League Match',scheduled_at:f.scheduled_at.value?new Date(f.scheduled_at.value).toISOString():null,player_one_registration_id:one.id,player_one_name:one.full_name,player_one_gamer_tag:one.gamer_tag,player_two_registration_id:two.id,player_two_name:two.full_name,player_two_gamer_tag:two.gamer_tag,created_by:(await db.auth.getUser()).data.user?.id||null};
      try{const {error}=await db.from('oj_matches').insert(payload);if(error)throw error;f.reset();await loadMatches();say('matchMessage','Fixture created. It is now visible publicly as scheduled.','success');}catch(e){say('matchMessage',e.message,'error');}
    });
    $('matchRows')?.addEventListener('click',async ev=>{
      const b=ev.target.closest('button');if(!b)return;if(!isAdmin){say('matchMessage','Administrator verification is required.','error');return;}const m=matches.find(x=>x.id=== (b.dataset.score||b.dataset.approve||b.dataset.reject||b.dataset.matchDelete));if(!m)return;
      try{
        if(b.dataset.score!==undefined){const a=prompt(`Enter ${m.player_one_name}'s goals:`);if(a===null)return;const c=prompt(`Enter ${m.player_two_name}'s goals:`);if(c===null)return; if(!/^\d+$/.test(a)||!/^\d+$/.test(c)){say('matchMessage','Scores must be whole numbers (0 or higher).','error');return;}const {error}=await db.from('oj_matches').update({player_one_score:Number(a),player_two_score:Number(c),status:'pending_approval',submitted_by:'Admin',updated_at:new Date().toISOString()}).eq('id',m.id);if(error)throw error;say('matchMessage','Result submitted for approval. Approve it to update the public leaderboard.','success');}
        if(b.dataset.approve!==undefined){if(!confirm('Approve this result and include it in the public leaderboard?'))return;const {error}=await db.from('oj_matches').update({status:'approved',updated_at:new Date().toISOString()}).eq('id',m.id);if(error)throw error;say('matchMessage','Result approved. The public leaderboard will recalculate automatically.','success');}
        if(b.dataset.reject!==undefined){if(!confirm('Reject this submitted result?'))return;const {error}=await db.from('oj_matches').update({status:'rejected',updated_at:new Date().toISOString()}).eq('id',m.id);if(error)throw error;say('matchMessage','Result rejected. It will not count toward standings.','success');}
        if(b.dataset.matchDelete!==undefined){if(!confirm('Permanently delete this match?'))return;const {error}=await db.from('oj_matches').delete().eq('id',m.id);if(error)throw error;}
        await loadMatches();
      }catch(e){say('matchMessage',e.message,'error');}
    });
    db.auth.getSession().then(({data})=>{if(data.session)refresh();});
    db.auth.onAuthStateChange((_event,session)=>{if(session)refresh();else{isAdmin=false;players=[];matches=[];say('matchMessage','Signed out. Sign in with an administrator account.','error');}});
  }

  // PUBLIC FIXTURES + AUTOMATIC LEADERBOARD
  if ($('root')) {
    const renderPublic = async () => {
      try {
        const [mRes,lRes]=await Promise.all([
          db.from('oj_matches').select('id,tournament_name,game,round_label,scheduled_at,player_one_name,player_one_gamer_tag,player_two_name,player_two_gamer_tag,player_one_score,player_two_score,status').in('status',['scheduled','approved']).order('scheduled_at',{ascending:true}).limit(100),
          db.from('oj_leaderboard').select('*').order('tournament_name').order('position').limit(500)
        ]);
        if(mRes.error||lRes.error) return;
        const matches=mRes.data||[], table=lRes.data||[];
        const section=document.createElement('section');section.id='oj-match-centre-public';
        section.style.cssText='max-width:1240px;margin:0 auto;padding:24px 16px 54px;color:#f4f7ff;font-family:inherit';
        const groups=[...new Set(table.map(x=>`${x.tournament_name}|||${x.game}`))];
        const standings=groups.map(key=>{const [t,g]=key.split('|||');const rows=table.filter(x=>x.tournament_name===t&&x.game===g);return `<div style="margin:0 0 24px"><div style="color:#25d366;font-size:11px;font-weight:900;letter-spacing:2px;margin:0 0 10px">${esc(t)} · ${esc(g)}</div><div style="overflow:auto;border:1px solid #263650;border-radius:14px"><table style="width:100%;min-width:680px;border-collapse:collapse;background:#0b1226"><thead><tr>${['POS','PLAYER','P','W','D','L','GF','GA','GD','PTS'].map(h=>`<th style="padding:12px;text-align:left;color:#e6bd58;font-size:11px;border-bottom:1px solid #263650">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${[r.position,`${esc(r.player_name)} <small style="color:#9aa9c5">${esc(r.gamer_tag)}</small>`,r.played,r.wins,r.draws,r.losses,r.goals_for,r.goals_against,r.goal_difference,r.points].map(v=>`<td style="padding:12px;border-bottom:1px solid #1e2b44">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;}).join('');
        const fixtures=matches.map(m=>`<article style="padding:15px;border:1px solid #263650;border-radius:14px;background:#0b1226"><div style="color:#25d366;font-size:11px;font-weight:900">${esc(m.tournament_name)} · ${esc(m.round_label)}</div><div style="font-weight:800;margin:9px 0">${esc(m.player_one_gamer_tag)} <span style="color:#e6bd58">${m.status==='approved'?`${m.player_one_score} – ${m.player_two_score}`:'VS'}</span> ${esc(m.player_two_gamer_tag)}</div><div style="color:#9aa9c5;font-size:12px">${m.scheduled_at?esc(new Date(m.scheduled_at).toLocaleString()):'Date to be announced'} · ${esc(m.game)}</div></article>`).join('');
        section.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap;margin-bottom:20px"><div><div style="font-size:11px;letter-spacing:3px;color:#25d366;font-weight:900">LIVE COMPETITION DATA</div><h2 style="font-size:clamp(22px,4vw,32px);font-weight:900;margin:7px 0">MATCH CENTRE & LEADERBOARD</h2><p style="color:#aab5c9;margin:0">Standings update automatically after an administrator approves match results.</p></div><span style="font-size:11px;color:#25d366;border:1px solid #25d36666;padding:8px 12px;border-radius:99px">LIVE FROM SUPABASE</span></div>${standings||'<p style="color:#aab5c9">The official leaderboard will appear after the first match result is approved.</p>'}<div style="margin-top:28px"><h3 style="font-size:18px;font-weight:900;margin-bottom:12px">FIXTURES & RESULTS</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px">${fixtures||'<p style="color:#aab5c9">No fixtures have been published yet.</p>'}</div></div>`;
        const existing=$('oj-match-centre-public');if(existing)existing.remove();const footer=document.querySelector('footer');(footer?.parentNode||document.body).insertBefore(section,footer||null);
      } catch(e) { /* Keep the original site usable if the new tables are not installed yet. */ }
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderPublic);else renderPublic();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderPublic();});
  }
})();
