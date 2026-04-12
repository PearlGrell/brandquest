import { supabase } from "./supabaseClient";

// ==================== Auth ====================

export async function loginTeam(teamId?: string | null, password?: string, rollNumber?: string | null) {
  if (!password) throw new Error("Password is required");

  if (teamId) {
    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (error || !team) throw new Error("Team not found");
    
    if (team.password !== password) throw new Error("Invalid credentials");

    return { session: { token: "supabase-m-session", teamId: team.id, teamName: team.name, isSolo: false, wantsMatchup: team.wants_matchup } };
  }

  if (rollNumber) {
    const { data: p, error } = await supabase
      .from("participants")
      .select("*, teams(*)")
      .eq("roll_number", rollNumber.toUpperCase())
      .single();

    if (error || !p) throw new Error("Participant not found");
    if (p.password !== password) throw new Error("Invalid credentials");

    return { 
      session: { 
        token: "supabase-m-session", 
        participantId: p.id,
        teamId: p.team_id, 
        teamName: (p.teams)?.name || p.name, 
        isSolo: !p.team_id, 
        wantsMatchup: (p.teams)?.wants_matchup || false,
        rollNumber: p.roll_number,
        participantName: p.name
      } 
    };
  }

  throw new Error("Invalid credentials");
}

export async function registerTeam(teamId: string, teamName: string, password: string, email: string, isSolo: boolean = false, wantsMatchup: boolean = false, members = []) {
  if (isSolo) {
    const solo = members[0];
    
    const { data: existingParticipant } = await supabase
      .from("participants")
      .select("*")
      .eq("roll_number", solo.rollNumber.toUpperCase())
      .single();
    
    if (existingParticipant) throw new Error("A participant with this roll number is already registered");
    
    const { error } = await supabase.from("participants").insert({
      name: solo.name,
      email,
      password,
      year: solo.year,
      roll_number: solo.rollNumber.toUpperCase(),
      team_id: null
    });
    if (error) throw new Error(error.message);
  } else {
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("*")
      .ilike("name", teamName)
      .single();
    
    if (existingTeam) throw new Error("A team with this name is already registered. Please choose a different team name");
    
    for (const m of members) {
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("*")
        .eq("roll_number", m.rollNumber.toUpperCase())
        .single();
      
      if (existingParticipant) throw new Error(`The roll number "${m.rollNumber}" is already registered`);
    }
    
    const { error: teamErr } = await supabase.from("teams").insert({
      id: teamId,
      name: teamName,
      password,
      is_solo: false,
      wants_matchup: !!wantsMatchup
    });
    if (teamErr) throw new Error(teamErr.message);

    for (const m of members) {
      const { error: partErr } = await supabase.from("participants").insert({
        team_id: teamId,
        name: m.name,
        email,
        password,
        year: m.year,
        roll_number: m.rollNumber.toUpperCase()
      });
      if (partErr) throw new Error(partErr.message);
    }
  }

  return { message: "Registration successful", teamId: isSolo ? null : teamId };
}


export async function getMatchupPool(currentTeamId?: string) {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*, participants(*)")
    .eq("wants_matchup", true);

  if (error) throw new Error(error.message);

  return teams
    .filter(t => t.participants.length < 3 && t.id !== currentTeamId)
    .map(t => ({
      ...t,
      leaderName: t.participants[0]?.name || t.name,
      currentSize: t.participants.length
    }));
}

export async function joinMatchup(participantId: string, targetTeamId: string) {
  const { data, error } = await supabase.rpc("join_matchup", { 
    p_participant_id: participantId, 
    p_target_team_id: targetTeamId 
  });

  if (error) throw new Error(error.message);

  return { 
    message: "Successfully joined team", 
    session: {
      token: "supabase-m-session",
      teamId: data.teamId,
      teamName: data.teamName,
      isSolo: false,
      wantsMatchup: true
    }
  };
}

// ==================== QR Scanning ====================

export async function scanQRCode(teamId: string, stageNumber: number) {
  const { data, error } = await supabase.rpc("scan_qr_code", { 
    p_team_id: teamId, 
    p_stage_number: stageNumber 
  });

  if (error) throw new Error(error.message);
  return data; // returns { success, message, scan: { ... } }
}

export async function getQRScans(teamId: string) {
  const { data: scansData, error: scansError } = await supabase
    .from("scans")
    .select("*")
    .eq("team_id", teamId)
    .order("scanned_at", { ascending: true }); // Order by actual scan time

  if (scansError) throw new Error(scansError.message);

  const { data: teamData } = await supabase
    .from("teams")
    .select("assigned_brand")
    .eq("id", teamId)
    .single();

  const formattedScans = scansData.map((scan) => ({
    stageNumber: scan.stage_number,
    randomDigit: scan.revealed_digit || "-",
    scannedAt: scan.scanned_at,
  }));

  const completion = (formattedScans.length === 5 && teamData?.assigned_brand)
    ? { brandName: teamData.assigned_brand, completedAt: formattedScans[4].scannedAt }
    : undefined;

  return { scans: formattedScans, completion };
}

// ==================== Participants ====================

export async function getParticipants(teamId: string) {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("team_id", teamId);

  if (error) throw new Error(error.message);
  return data;
}

export async function addParticipant(teamId: string, name: string, email: string, year: string, rollNumber: string) {
  const { data, error } = await supabase
    .from("participants")
    .insert({ team_id: teamId, name, email, year, roll_number: rollNumber.toUpperCase() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function adminAddParticipant(name: string, email: string, rollNumber: string, year: string, adminPassword: string) {
  if (adminPassword !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("participants")
    .insert({
      name,
      email,
      roll_number: rollNumber.toUpperCase(),
      year,
      password: "Celestio26",
      team_id: null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ==================== Event Control ====================

function parseRegistrationDeadline(deadlineRaw: string): Date | null {
  // Treat `datetime-local` values as local time (not UTC/GMT).
  const localMatch = deadlineRaw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (localMatch) {
    const [, y, m, d, h, min, s = "0"] = localMatch;
    const localDate = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(h),
      Number(min),
      Number(s)
    );
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  // If timezone exists in the value (e.g. `Z` or `+05:30`), honor it.
  const parsed = new Date(deadlineRaw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getEventStatus() {
  const { data: config, error } = await supabase.from("event_config").select("*");

  if (error) throw new Error(error.message);
  
  const map = new Map(config.map(c => [c.key, c.value]));
  const deadlineRaw = map.get("registrationDeadline") || null;
  const endedManually = map.get("registrationEnded") === "true";

  let endedByDeadline = false;
  if (deadlineRaw) {
    const deadline = parseRegistrationDeadline(deadlineRaw);
    if (deadline) {
      endedByDeadline = Date.now() >= deadline.getTime();
    }
  }
  
  return { 
    isStarted: map.get("isStarted") === "true",
    registrationEnded: endedManually || endedByDeadline,
    registrationDeadline: deadlineRaw,
    currentRound: parseInt((map.get("currentRound") as string) || "1"),
    r2Open: map.get("r2_open") === "true",
    r2Deadline: map.get("r2_deadline") || null,
    r3Open: map.get("r3_open") === "true",
    r3Deadline: map.get("r3_deadline") || null
  };
}

export async function startEvent() {
  const { error } = await supabase
    .from("event_config")
    .upsert({ key: "isStarted", value: "true" });

  if (error) throw new Error(error.message);
  return { message: "Event started" };
}

// ==================== Leaderboard ====================

export async function getLeaderboard() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      id, 
      name, 
      is_solo, 
      scans(scanned_at),
      games_completed(completed_at)
    `);

  if (error) throw new Error(error.message);

  const leaderboard = teams.map(t => {
    // Get latest scan timestamp for tie-breaking
    const lastActivity = t.scans.length > 0 ? Math.max(...t.scans.map(s => new Date(s.scanned_at).getTime())) : 0;

    return {
      id: t.id,
      name: t.name,
      isSolo: t.is_solo,
      scanCount: t.scans.length,
      gamesCount: t.games_completed.length,
      lastActivity
    };
  }).sort((a, b) => {
    // 1. More scans first
    if (b.scanCount !== a.scanCount) return b.scanCount - a.scanCount;
    // 2. Earlier completion time first (if activity exists)
    if (a.lastActivity > 0 && b.lastActivity > 0) return a.lastActivity - b.lastActivity;
    return 0;
  });

  return { leaderboard };
}

// ==================== Games ====================

export async function markGameComplete(teamId: string, levelId: number, levelName: string) {
  const { error } = await supabase.rpc("mark_game_complete", {
    p_team_id: teamId,
    p_level_id: levelId,
    p_level_name: levelName
  });

  if (error) throw new Error(error.message);
  return { message: "Game marked as complete" };
}

export async function getCompletedGames(teamId: string) {
  const { data, error } = await supabase
    .from("games_completed")
    .select("*")
    .eq("team_id", teamId);

  if (error) throw new Error(error.message);
  return { completed: data };
}

// ==================== Hero/Dashboard ====================

export async function getTeamsStats() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      id, name, is_solo,
      scans(id),
      games_completed(id),
      participants(*)
    `);

  if (error) throw new Error(error.message);

  const stats = teams.map(t => ({
    id: t.id,
    name: t.name,
    isSolo: t.is_solo,
    qr: {
      scanned: t.scans.length,
      total: 5,
      completed: t.scans.length >= 5,
    },
    games: {
      completed: t.games_completed.length,
      total: 2,
    },
    participants: t.participants
  }));

  return { teams: stats };
}

export async function getTeamParticipants(teamId: string) {
  return getParticipants(teamId);
}

export async function adminSeedSoloist(participantId: string, targetTeamId: string, adminPassword: string) {
  if (adminPassword !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  
  const { error } = await supabase
    .from("participants")
    .update({ team_id: targetTeamId })
    .eq("id", participantId);

  if (error) throw new Error(error.message);
  return { message: "Seeding successful" };
}

export async function adminCreateTeam(teamName: string, password: string, adminPassword: string) {
  if (adminPassword !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  
  const teamId = `CEL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const { data, error } = await supabase
    .from("teams")
    .insert({
      id: teamId,
      name: teamName,
      password,
      is_solo: false,
      wants_matchup: true,
      is_admin_created: true
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { team: data };
}

export async function adminExportData(adminPassword: string) {
  if (adminPassword !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  
  const { data: teams, error: tErr } = await supabase.from("teams").select("*, participants(*)");
  const { data: soloists, error: sErr } = await supabase.from("participants").select("*").is("team_id", null);

  if (tErr || sErr) throw new Error("Export failed");
  return { teams, unassignedParticipants: soloists };
}

export async function getEventConfig(password: string) {
  if (password !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  const { data, error } = await supabase.from("event_config").select("*");
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEventConfig(key: string, value: string, adminPassword: string) {
  if (adminPassword !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  const { error } = await supabase.from("event_config").upsert({ key, value });
  if (error) throw new Error(error.message);
  return { message: `Config ${key} updated` };
}

export async function getEventCounters() {
  const { count: teamsCount, error: tErr } = await supabase.from("teams").select("*", { count: "exact", head: true });
  const { count: participantsCount, error: pErr } = await supabase.from("participants").select("*", { count: "exact", head: true });

  if (tErr || pErr) throw new Error("Failed to fetch counters");
  return { teams: teamsCount, participants: participantsCount };
}

export async function syncSession(teamId?: string, rollNumber?: string) {
  if (rollNumber) {
    const { data: p, error } = await supabase
      .from("participants")
      .select("*, teams(*)")
      .eq("roll_number", rollNumber)
      .single();
    if (error || !p) throw new Error("Sync failed");
    return { 
      participantId: p.id, 
      teamId: p.team_id, 
      teamName: (p.teams)?.name || p.name, 
      isSolo: !p.team_id, 
      wantsMatchup: (p.teams)?.wants_matchup || false 
    };
  } else if (teamId) {
    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();
    if (error || !team) throw new Error("Sync failed");
    return { 
      teamId: team.id, 
      teamName: team.name, 
      isSolo: false, 
      wantsMatchup: team.wants_matchup 
    };
  }
  throw new Error("Sync failed");
}

export async function getAdminData(password: string) {
  if (password !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  const { data: soloists, error: sErr } = await supabase.from("participants").select("*").is("team_id", null);
  const { data: teams, error: tErr } = await supabase.from("teams").select("*, participants(*)").eq("wants_matchup", true);
  
  if (sErr || tErr) throw new Error("Failed to fetch admin data");
  return { soloists, teamsWithSpace: teams.filter(t => t.participants.length < 3) };
}


// ==================== Brands ====================

export async function getBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function addBrand(name: string) {
  const { data, error } = await supabase
    .from("brands")
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBrand(id: number) {
  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { message: "Brand deleted" };
}

// ==================== Submissions ====================

export async function submitRound(teamId: string, round: number, link1: string, link2: string) {
  const { data, error } = await supabase
    .from("submissions")
    .insert({ team_id: teamId, round, link_1: link1, link_2: link2 })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSubmission(teamId: string, round: number) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("team_id", teamId)
    .eq("round", round)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function adminGetSubmissions(password: string, round: number) {
  if (password !== "CELESTIO26BRANDQUEST") throw new Error("Unauthorized");
  
  const { data, error } = await supabase
    .from("submissions")
    .select("*, teams(name)")
    .eq("round", round);

  if (error) throw new Error(error.message);
  return data;
}

