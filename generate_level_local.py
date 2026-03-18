"""
Zone X Level Generator (lokal, kein API-Key nötig).
Baut ein Level algorithmisch mit echter Zufälligkeit (Seed = Level-Nummer).

Usage:
    python generate_level_local.py [difficulty] [output_file]

Examples:
    python generate_level_local.py          -> levels/6.json  (default diff=6)
    python generate_level_local.py 7        -> levels/7.json
    python generate_level_local.py 4 levels/test.json
"""

import json, pathlib, sys, random
from collections import deque

# ── Tile IDs ────────────────────────────────────────────────────────────────
FLOOR=0; WALL=1; PLUTONIUM=2; CONTAINER=3; KEY=4; MAT=5; TIME=6
BONUS=7; SPADE=8; CRUMBLY=9; GREEN_DOOR=10; SLAM=11; LASER=12
AIRLOCK=13; WARP=14; OUT=15; ACID=16; FORCE=17
CONV_R=18; CONV_L=19; CONV_U=20; CONV_D=21
CHEST=22; CAMERA=23; ALARM=24; ELECTRO=25

# ── Helpers ─────────────────────────────────────────────────────────────────
def make_grid():
    return [[WALL]*36 for _ in range(36)]

def carve(g, r1, r2, c1, c2):
    for r in range(max(1,r1), min(35,r2)+1):
        for c in range(max(1,c1), min(35,c2)+1):
            g[r][c] = FLOOR

def flood_fill(g, start):
    visited = set()
    q = deque([start])
    while q:
        r, c = q.popleft()
        if (r,c) in visited or not (0<=r<36 and 0<=c<36) or g[r][c] == WALL:
            continue
        visited.add((r,c))
        for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            q.append((r+dr, c+dc))
    return visited

def free_in(g, r1, r2, c1, c2, used):
    """Random floor positions within rect that are not in used."""
    r1 = max(0, r1); r2 = min(35, r2); c1 = max(0, c1); c2 = min(35, c2)
    cells = [(r,c) for r in range(r1,r2+1) for c in range(c1,c2+1)
             if g[r][c] == FLOOR and (r,c) not in used]
    random.shuffle(cells)
    return cells

def scatter(g, r1, r2, c1, c2, tile, count, used):
    cells = free_in(g, r1, r2, c1, c2, used)
    placed = []
    for pos in cells[:count]:
        g[pos[0]][pos[1]] = tile
        used.add(pos)
        placed.append(pos)
    return placed

def pick_one(g, r1, r2, c1, c2, used):
    cells = free_in(g, r1, r2, c1, c2, used)
    if not cells:
        return None
    pos = cells[0]
    used.add(pos)
    return pos

# ── Level Blueprints per difficulty ─────────────────────────────────────────
def build_level(difficulty: int, seed: int = None) -> dict:
    random.seed(seed)
    R = random  # shorthand

    g = make_grid()
    used = set()  # occupied positions (no two special tiles overlap)

    warp_pairs_data = []
    cameras_data = []

    # ────────────────────────────────────────────────────────────────────────
    # Difficulty 1-2: One big open room, random pillar scatter
    # ────────────────────────────────────────────────────────────────────────
    if difficulty <= 2:
        # Room bounds vary by seed
        ro = R.randint(0, 3); co = R.randint(0, 3)
        r1, r2 = 2+ro, 33-R.randint(0,2)
        c1, c2 = 2+co, 33-R.randint(0,2)
        carve(g, r1, r2, c1, c2)

        # Random internal pillars
        for _ in range(R.randint(4, 12)):
            pr = R.randint(r1+3, r2-3)
            pc = R.randint(c1+3, c2-3)
            g[pr][pc] = WALL

        # Player start: near top-left
        ps_r = R.randint(r1+1, r1+4)
        ps_c = R.randint(c1+1, c1+4)
        while g[ps_r][ps_c] != FLOOR:
            ps_r = R.randint(r1+1, r1+5); ps_c = R.randint(c1+1, c1+5)
        player_start = {"c": ps_c, "r": ps_r}
        used.add((ps_r, ps_c))

        # OUT: far corner
        out_r = R.randint(r2-4, r2-1); out_c = R.randint(c2-4, c2-1)
        while g[out_r][out_c] != FLOOR or (out_r,out_c) in used:
            out_r = R.randint(r2-5, r2-1); out_c = R.randint(c2-5, c2-1)
        g[out_r][out_c] = OUT; used.add((out_r, out_c))

        scatter(g, r1+2, r2-2, c1+2, c2-2, CONTAINER, 1, used)
        n_plut = 2 if difficulty == 1 else 3
        scatter(g, r1+1, r2-1, c1+1, c2-1, PLUTONIUM, n_plut, used)
        scatter(g, r1+1, r2-1, c1+1, c2-1, TIME, 1, used)

        if difficulty == 2:
            barrier_r = R.randint(r1+6, r2-6)
            bc = R.randint(c1+3, c1+8)
            gap = R.randint(bc+1, bc+4)
            acid_len = R.randint(4, 8)
            for c in range(bc, bc+acid_len):
                if c != gap and g[barrier_r][c] == FLOOR and (barrier_r,c) not in used:
                    g[barrier_r][c] = ACID

        def rand_robot_pos(avoid_used=True):
            for _ in range(200):
                rr = R.randint(r1+2, r2-2); rc = R.randint(c1+3, c2-3)
                if g[rr][rc] == FLOOR and (not avoid_used or (rr,rc) not in used):
                    return rr, rc
            return r1+3, c1+3

        rr, rc = rand_robot_pos()
        robots = [{"c":rc,"r":rr, "axis":R.choice(["h","v"]),
                   "range":R.randint(4,8), "speed":round(R.uniform(0.6,0.9),1), "type":"normal"}]
        if difficulty == 2:
            rr2, rc2 = rand_robot_pos()
            robots.append({"c":rc2,"r":rr2, "axis":R.choice(["h","v"]),
                           "range":R.randint(3,6), "speed":0.8, "type":"normal"})

    # ────────────────────────────────────────────────────────────────────────
    # Difficulty 3-4: 3-4 rooms, key + door system
    # ────────────────────────────────────────────────────────────────────────
    elif difficulty <= 4:
        # Shuffle which quadrant each room occupies
        layouts = [
            # (start_room, hub_room, plut_room, north_room)
            dict(
                start  =(R.randint(13,16), R.randint(20,23),  R.randint(1,3),  R.randint(8,11)),
                hub    =(R.randint(13,16), R.randint(20,23),  R.randint(10,13), R.randint(22,25)),
                plut   =(R.randint(13,16), R.randint(20,23),  R.randint(24,27), R.randint(33,34)),
                north  =(R.randint(2,5),   R.randint(11,14),  R.randint(9,12),  R.randint(25,28)),
            )
        ]
        L = layouts[0]
        # (r1,r2, c1,c2) for each room
        SR = L['start']; HB = L['hub']; PL = L['plut']; NO = L['north']

        carve(g, SR[0], SR[1], SR[2], SR[3])
        carve(g, HB[0], HB[1], HB[2], HB[3])
        carve(g, PL[0], PL[1], PL[2], PL[3])
        carve(g, NO[0], NO[1], NO[2], NO[3])
        # Corridors connecting rooms
        mid_r_sh = (SR[0]+SR[1])//2
        mid_r_hn = (HB[0]+NO[1])//2
        carve(g, mid_r_sh, mid_r_sh, SR[3], HB[2])    # start -> hub
        carve(g, mid_r_sh, mid_r_sh, HB[3], PL[2])    # hub -> plut
        mid_c_hn = (HB[2]+HB[3])//2
        carve(g, NO[1], HB[0], mid_c_hn, mid_c_hn+1)  # hub -> north

        player_start = {"c": SR[2]+2, "r": mid_r_sh}
        used.add((mid_r_sh, SR[2]+2))

        # OUT in plut room
        out_pos = pick_one(g, PL[0]+1, PL[1]-1, PL[3]-3, PL[3]-1, used)
        if out_pos: g[out_pos[0]][out_pos[1]] = OUT

        # GREEN_DOOR between hub and plut
        door_c = HB[3] + (PL[2]-HB[3])//2
        if g[mid_r_sh][door_c] == FLOOR and (mid_r_sh, door_c) not in used:
            g[mid_r_sh][door_c] = GREEN_DOOR; used.add((mid_r_sh, door_c))

        scatter(g, HB[0]+1, HB[1]-1, HB[2]+1, HB[3]-1, CONTAINER, 1, used)

        n_plut = R.randint(3, 4) if difficulty == 4 else 2
        scatter(g, NO[0]+1, NO[1]-1, NO[2]+1, NO[3]-1, PLUTONIUM, n_plut//2 + n_plut%2, used)
        scatter(g, PL[0]+1, PL[1]-1, PL[2]+1, PL[3]-2, PLUTONIUM, n_plut//2, used)

        # Key in north room
        scatter(g, NO[0]+1, NO[1]-1, NO[2]+1, NO[3]-1, KEY, 1, used)

        scatter(g, HB[0]+1, HB[1]-1, HB[2]+1, HB[3]-1, TIME, 1, used)
        scatter(g, NO[0]+1, NO[1]-1, NO[2]+1, NO[3]-1, CHEST, 1, used)

        # Acid strip in hub corridor
        acid_r = mid_r_sh + R.choice([-1, 1])
        for c in range(HB[2]+2, HB[3]-2):
            if R.random() < 0.3 and g[acid_r][c] == FLOOR and (acid_r,c) not in used:
                g[acid_r][c] = ACID

        if difficulty == 4:
            scatter(g, HB[0]+1, HB[1]-1, HB[2]+1, HB[3]-1, CRUMBLY, 2, used)
            scatter(g, NO[0]+1, NO[1]-1, NO[2]+1, NO[3]-1, SPADE, 1, used)
            scatter(g, NO[0]+1, NO[1]-1, NO[2]+1, NO[3]-1, TIME, 1, used)

        def rp(r1,r2,c1,c2):
            cells = free_in(g,r1,r2,c1,c2,used)
            return (cells[0][0],cells[0][1]) if cells else (r1+1,c1+1)

        r1p,c1p = rp(NO[0]+1,NO[1]-1,NO[2]+1,NO[3]-1)
        r2p,c2p = rp(PL[0]+1,PL[1]-1,PL[2]+1,PL[3]-2)
        robots = [
            {"c":c1p,"r":r1p,"axis":R.choice(["h","v"]),"range":R.randint(4,6),"speed":round(R.uniform(0.8,1.0),1),"type":"normal"},
            {"c":c2p,"r":r2p,"axis":R.choice(["h","v"]),"range":R.randint(3,5),"speed":round(R.uniform(0.9,1.1),1),"type":"normal"},
        ]
        if difficulty == 4:
            r3p,c3p = rp(HB[0]+1,HB[1]-1,HB[2]+1,HB[3]-1)
            robots.append({"c":c3p,"r":r3p,"axis":"h","range":R.randint(3,5),"speed":1.0,"type":"normal"})

    # ────────────────────────────────────────────────────────────────────────
    # Difficulty 5-6: 5 rooms, laser + camera + warp + force field
    # ────────────────────────────────────────────────────────────────────────
    elif difficulty <= 6:
        # Random offsets so rooms shift slightly
        dr = R.randint(-2, 2); dc = R.randint(-2, 2)

        def rm(r1,r2,c1,c2):
            return (max(2,r1+dr), min(34,r2+dr), max(2,c1+dc), min(34,c2+dc))

        A = rm(15,21, 1, 9)   # Start
        B = rm(12,25,12,21)   # Hub
        C = rm( 2, 9,12,27)   # North Plutonium
        D = rm(28,34,12,26)   # South Plutonium
        E = rm( 9,33,28,34)   # East Wing

        carve(g, *A); carve(g, *B); carve(g, *C); carve(g, *D); carve(g, *E)

        # Corridors
        midA_r = (A[0]+A[1])//2
        carve(g, midA_r, midA_r, A[3], B[2]+1)      # A->B
        carve(g, B[0], B[0]+1, (B[2]+B[3])//2, (B[2]+B[3])//2+1)  # B->C
        carve(g, B[1]-1, B[1], (B[2]+B[3])//2, (B[2]+B[3])//2+1)  # B->D
        carve(g, (B[0]+B[1])//2, (B[0]+B[1])//2+1, B[3], E[2]+1)  # B->E

        player_start = {"c": A[2]+2, "r": midA_r}
        used.add((midA_r, A[2]+2))

        # SLAM at A->B junction
        slam_c = A[3]+1
        if g[midA_r][slam_c] == FLOOR and (midA_r,slam_c) not in used:
            g[midA_r][slam_c] = SLAM; used.add((midA_r, slam_c))

        # OUT in East
        out_pos = pick_one(g, E[0]+1, E[1]-1, E[3]-3, E[3]-1, used)
        if out_pos: g[out_pos[0]][out_pos[1]] = OUT

        # Doors
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, GREEN_DOOR, 1, used)
        scatter(g, (B[0]+B[1])//2-1, (B[0]+B[1])//2+1, B[3], B[3]+2, GREEN_DOOR, 1, used)
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, LASER, 1, used)
        scatter(g, (B[0]+B[1])//2-1, (B[0]+B[1])//2+1, B[3]-2, B[3]-1, LASER, 1, used)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, FORCE, 1, used)

        # Warps (2 pairs)
        w1a = pick_one(g, B[0]+1, B[1]-1, B[2]+1, B[3]-1, used)
        w1b = pick_one(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, used)
        if w1a and w1b:
            g[w1a[0]][w1a[1]] = WARP; g[w1b[0]][w1b[1]] = WARP
            warp_pairs_data.append({"from":{"c":w1a[1],"r":w1a[0]},"to":{"c":w1b[1],"r":w1b[0]}})

        # Container in Hub
        scatter(g, B[0]+1, B[1]-1, B[2]+1, B[3]-1, CONTAINER, 1, used)

        # Plutonium
        n_plut = 4 if difficulty == 5 else 5
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, PLUTONIUM, (n_plut+1)//2, used)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, PLUTONIUM, n_plut//2, used)

        # Keys (cross-locked)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, KEY, 1, used)  # Key A opens C door
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, KEY, 1, used)  # Key B opens B->E door

        # Spade + Crumbly shortcut
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, SPADE, 1, used)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, CRUMBLY, R.randint(2,4), used)

        # Time + Chests
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, TIME, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, TIME, 1, used)
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, CHEST, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, CHEST, 1, used)

        # Camera + electro in East
        cam_pos = pick_one(g, E[0]+1, E[0]+3, E[2]+1, E[3]-1, used)
        if cam_pos:
            g[cam_pos[0]][cam_pos[1]] = CAMERA
            cameras_data.append({"c":cam_pos[1],"r":cam_pos[0],"range":6,
                                  "angleStart":R.uniform(0,3.14),"angleSweep":R.uniform(0.6,1.2)})
            scatter(g, cam_pos[0]+1, cam_pos[0]+3, cam_pos[1]-1, cam_pos[1]+3, ELECTRO, R.randint(3,5), used)

        # Acid in corridors
        scatter(g, C[0]+1, C[1]-1, C[2]+2, C[2]+5, ACID, R.randint(3,6), used)
        scatter(g, D[0]+1, D[0]+2, D[2]+1, D[3]-1, ACID, R.randint(3,5), used)

        # Conveyors in hub
        conv_r = (B[0]+B[1])//2
        hub_cells = free_in(g, B[0]+1, B[1]-1, B[2]+1, B[3]-1, used)
        for tile in [CONV_R, CONV_L, CONV_U, CONV_D]:
            if hub_cells:
                pos = hub_cells.pop()
                g[pos[0]][pos[1]] = tile; used.add(pos)

        def rp(r1,r2,c1,c2):
            cells = free_in(g,r1,r2,c1,c2,used)
            return (cells[0][0],cells[0][1]) if cells else (r1+1,c1+1)

        ra,ca=rp(C[0]+1,C[1]-1,C[2]+1,C[3]-1)
        rb,cb=rp(D[0]+1,D[1]-1,D[2]+1,D[3]-1)
        rc2,cc2=rp(B[0]+1,B[1]-1,B[2]+1,B[3]-1)
        rd,cd=rp(E[0]+1,E[1]-1,E[2]+1,E[3]-1)
        re2,ce2=rp(E[0]+3,E[1]-1,E[2]+1,E[3]-1)
        robots = [
            {"c":ca,"r":ra,"axis":"h","range":R.randint(5,8),"speed":round(R.uniform(0.9,1.1),1),"type":"normal"},
            {"c":cb,"r":rb,"axis":"h","range":R.randint(4,7),"speed":round(R.uniform(0.8,1.0),1),"type":"normal"},
            {"c":cc2,"r":rc2,"axis":"h","range":R.randint(3,6),"speed":round(R.uniform(0.9,1.1),1),"type":"normal"},
            {"c":cd,"r":rd,"axis":"h","range":R.randint(5,8),"speed":round(R.uniform(1.2,1.6),1),"type":"fast"},
            {"c":ce2,"r":re2,"axis":"v","range":R.randint(4,7),"speed":round(R.uniform(1.2,1.5),1),"type":"fast"},
        ]

    # ────────────────────────────────────────────────────────────────────────
    # Difficulty 7-10: Extended 6-room layout, heavy robots, 2nd camera
    # ────────────────────────────────────────────────────────────────────────
    else:
        dr = R.randint(-2, 2); dc = R.randint(-2, 2)

        def rm(r1,r2,c1,c2):
            return (max(2,r1+dr), min(34,r2+dr), max(2,c1+dc), min(34,c2+dc))

        A = rm(15,21, 1, 9)
        B = rm(12,25,12,21)
        C = rm( 2, 9,12,27)
        D = rm(28,34,12,26)
        E = rm( 9,33,28,34)
        F = rm( 2, 8,28,34)  # Far north-east bonus room

        carve(g, *A); carve(g, *B); carve(g, *C); carve(g, *D); carve(g, *E); carve(g, *F)

        # Corridors
        midA_r = (A[0]+A[1])//2
        carve(g, midA_r, midA_r, A[3], B[2]+1)
        carve(g, B[0], B[0]+1, (B[2]+B[3])//2, (B[2]+B[3])//2+1)
        carve(g, B[1]-1, B[1], (B[2]+B[3])//2, (B[2]+B[3])//2+1)
        carve(g, (B[0]+B[1])//2, (B[0]+B[1])//2+1, B[3], E[2]+1)
        carve(g, F[1], E[0]+1, (E[2]+E[3])//2, (E[2]+E[3])//2+1)  # E->F

        player_start = {"c": A[2]+2, "r": midA_r}
        used.add((midA_r, A[2]+2))

        # SLAM doors
        slam_c = A[3]+1
        if g[midA_r][slam_c] == FLOOR and (midA_r,slam_c) not in used:
            g[midA_r][slam_c] = SLAM; used.add((midA_r, slam_c))
        scatter(g, (B[0]+B[1])//2-1, (B[0]+B[1])//2+1, B[3]-1, B[3]+1, SLAM, 1, used)

        # OUT in F room
        out_pos = pick_one(g, F[0]+1, F[1]-1, F[3]-3, F[3]-1, used)
        if out_pos: g[out_pos[0]][out_pos[1]] = OUT

        # Doors: 3 green + 2 laser
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, GREEN_DOOR, 1, used)
        scatter(g, (B[0]+B[1])//2-1, (B[0]+B[1])//2+1, B[3], B[3]+2, GREEN_DOOR, 1, used)
        scatter(g, F[0]+1, F[1]-1, F[2]+1, F[3]-1, GREEN_DOOR, 1, used)
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, LASER, 1, used)
        scatter(g, (B[0]+B[1])//2-1, (B[0]+B[1])//2+1, B[3]-3, B[3]-1, LASER, 1, used)
        scatter(g, F[0]+1, F[1]-1, F[2]+1, F[3]-1, LASER, 1, used)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, FORCE, 1, used)

        # Warps (2 pairs)
        w1a = pick_one(g, B[0]+1, B[1]-1, B[2]+1, B[3]-1, used)
        w1b = pick_one(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, used)
        w2a = pick_one(g, F[0]+1, F[1]-1, F[2]+1, F[3]-1, used)
        w2b = pick_one(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, used)
        if w1a and w1b:
            g[w1a[0]][w1a[1]] = WARP; g[w1b[0]][w1b[1]] = WARP
            warp_pairs_data.append({"from":{"c":w1a[1],"r":w1a[0]},"to":{"c":w1b[1],"r":w1b[0]}})
        if w2a and w2b:
            g[w2a[0]][w2a[1]] = WARP; g[w2b[0]][w2b[1]] = WARP
            warp_pairs_data.append({"from":{"c":w2a[1],"r":w2a[0]},"to":{"c":w2b[1],"r":w2b[0]}})

        # 2 Containers
        scatter(g, B[0]+1, B[1]-1, B[2]+1, B[3]-1, CONTAINER, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, CONTAINER, 1, used)

        # Plutonium (6)
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, PLUTONIUM, 2, used)
        scatter(g, F[0]+1, F[1]-1, F[2]+1, F[3]-1, PLUTONIUM, 2, used)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, PLUTONIUM, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, PLUTONIUM, 1, used)

        # Keys (3 cross-locked)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, KEY, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, KEY, 1, used)
        scatter(g, F[0]+1, F[1]-1, F[2]+1, F[3]-1, KEY, 1, used)

        # Spade + Crumbly
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, SPADE, 1, used)
        scatter(g, D[0]+1, D[1]-1, D[2]+1, D[3]-1, CRUMBLY, R.randint(3,5), used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, CRUMBLY, R.randint(2,3), used)

        # Time + Chests
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, TIME, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, TIME, 1, used)
        scatter(g, F[0]+1, F[1]-1, F[2]+1, F[3]-1, TIME, 1, used)
        scatter(g, C[0]+1, C[1]-1, C[2]+1, C[3]-1, CHEST, 1, used)
        scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, CHEST, 1, used)

        # Camera 1 in East
        cam_pos = pick_one(g, E[0]+1, E[0]+3, E[2]+1, E[3]-1, used)
        if cam_pos:
            g[cam_pos[0]][cam_pos[1]] = CAMERA
            cameras_data.append({"c":cam_pos[1],"r":cam_pos[0],"range":6,
                                  "angleStart":R.uniform(0,3.14),"angleSweep":R.uniform(0.6,1.0)})
            scatter(g, cam_pos[0]+1, cam_pos[0]+3, cam_pos[1]-1, cam_pos[1]+3, ELECTRO, R.randint(3,5), used)

        # Camera 2 in B (hub)
        cam_pos2 = pick_one(g, B[0]+1, B[1]-1, B[3]-3, B[3]-1, used)
        if cam_pos2:
            g[cam_pos2[0]][cam_pos2[1]] = CAMERA
            cameras_data.append({"c":cam_pos2[1],"r":cam_pos2[0],"range":5,
                                  "angleStart":R.uniform(0,3.14),"angleSweep":R.uniform(0.5,0.9)})
            scatter(g, cam_pos2[0]-1, cam_pos2[0]+2, cam_pos2[1]-2, cam_pos2[1]+1, ELECTRO, R.randint(2,4), used)

        # Acid
        scatter(g, C[0]+1, C[1]-1, C[2]+2, C[2]+5, ACID, R.randint(4,7), used)
        scatter(g, D[0]+1, D[0]+2, D[2]+1, D[3]-1, ACID, R.randint(3,6), used)
        scatter(g, E[0]+1, E[0]+3, E[2]+1, E[3]-2, ACID, R.randint(3,5), used)

        # Conveyors
        for tile in [CONV_R, CONV_L, CONV_U, CONV_D]:
            scatter(g, B[0]+1, B[1]-1, B[2]+1, B[3]-1, tile, 1, used)
        for tile in [CONV_U, CONV_D]:
            scatter(g, E[0]+1, E[1]-1, E[2]+1, E[3]-1, tile, 1, used)

        def rp(r1,r2,c1,c2):
            cells = free_in(g,r1,r2,c1,c2,used)
            return (cells[0][0],cells[0][1]) if cells else (r1+1,c1+1)

        ra,ca=rp(C[0]+1,C[1]-1,C[2]+1,C[3]-1)
        rb,cb=rp(D[0]+1,D[1]-1,D[2]+1,D[3]-1)
        rc2,cc2=rp(B[0]+1,B[1]-1,B[2]+1,B[3]-1)
        rd,cd=rp(E[0]+1,E[1]-1,E[2]+1,E[3]-1)
        re2,ce2=rp(F[0]+1,F[1]-1,F[2]+1,F[3]-1)
        robots = [
            {"c":ca,"r":ra,"axis":"h","range":R.randint(5,8),"speed":round(R.uniform(0.9,1.1),1),"type":"normal"},
            {"c":cb,"r":rb,"axis":"h","range":R.randint(4,7),"speed":round(R.uniform(0.8,1.0),1),"type":"normal"},
            {"c":cc2,"r":rc2,"axis":"h","range":R.randint(3,6),"speed":round(R.uniform(0.9,1.1),1),"type":"normal"},
            {"c":cd,"r":rd,"axis":"h","range":R.randint(5,8),"speed":round(R.uniform(1.3,1.6),1),"type":"fast"},
            {"c":ce2,"r":re2,"axis":"v","range":R.randint(4,7),"speed":round(R.uniform(1.3,1.5),1),"type":"fast"},
        ]
        if difficulty >= 7:
            rh,ch=rp(D[0]+1,D[1]-1,D[2]+1,D[3]-1)
            robots.append({"c":ch,"r":rh,"axis":"h","range":R.randint(3,5),"speed":round(R.uniform(0.7,0.9),1),"type":"heavy"})
        if difficulty >= 8:
            rf,cf=rp(E[0]+1,E[1]-1,E[2]+1,E[3]-1)
            robots.append({"c":cf,"r":rf,"axis":"v","range":R.randint(4,6),"speed":round(R.uniform(1.4,1.6),1),"type":"fast"})
        if difficulty >= 9:
            rb2,cb2=rp(C[0]+1,C[1]-1,C[2]+1,C[3]-1)
            robots.append({"c":cb2,"r":rb2,"axis":"v","range":R.randint(3,5),"speed":round(R.uniform(0.8,1.0),1),"type":"normal"})
        if difficulty >= 10:
            rh2,ch2=rp(F[0]+1,F[1]-1,F[2]+1,F[3]-1)
            robots.append({"c":ch2,"r":rh2,"axis":"h","range":R.randint(3,5),"speed":round(R.uniform(0.7,0.9),1),"type":"heavy"})

    # ── Validate ─────────────────────────────────────────────────────────────
    ps_r = player_start["r"]; ps_c = player_start["c"]
    assert g[ps_r][ps_c] == FLOOR, f"playerStart ({ps_c},{ps_r}) not on floor"

    reachable = flood_fill(g, (ps_r, ps_c))
    plut_pos = [(r,c) for r in range(36) for c in range(36) if g[r][c] == PLUTONIUM]
    missing = [p for p in plut_pos if p not in reachable]
    if missing:
        print(f"WARNING: {len(missing)} plutonium tiles unreachable — removing them")
        for r,c in missing:
            g[r][c] = FLOOR

    # Collect cameras from grid if not already in cameras_data
    if not cameras_data:
        for r in range(36):
            for c in range(36):
                if g[r][c] == CAMERA:
                    cameras_data.append({"c":c,"r":r,"range":6,
                        "angleStart":round(R.uniform(0,3.14),4),
                        "angleSweep":round(R.uniform(0.6,1.0),4)})

    # Remove any cameras placed as grid tiles (they're now in cameras_data)
    for cam in cameras_data:
        g[cam["r"]][cam["c"]] = FLOOR

    # Final plutonium count (after unreachable removal)
    plut_pos = [(r,c) for r in range(36) for c in range(36) if g[r][c] == PLUTONIUM]

    names = {
        1:"First Steps", 2:"Cooling Sector", 3:"Reactor Gate",
        4:"Pressure Test", 5:"Containment Breach", 6:"Flood Delta",
        7:"Reactor Core", 8:"Meltdown Ward", 9:"Critical Mass", 10:"Breach Protocol"
    }
    innovations = {
        1:"Offener Lernbereich — Spieler lernt den Kern-Loop ohne Druck.",
        2:"Erste Hindernisse — Saeurebarrieren erzwingen Umwege.",
        3:"Key-System — Schluessel liegt auf Umweg, Tuer bewacht Plutonium.",
        4:"Planung lohnt sich — ein versteckter Crumbly-Kurzweg existiert.",
        5:"Laser-Timing ist das Herzstuck — Warp als taktische Abkuerzung.",
        6:"Gegenseitig verschlossene Fluegel: Key A oeffnet Osten, Key B oeffnet Norden. SLAM-Einbahnstrasse, FORCE_FIELD im Ostkorridor.",
        7:"Heavy-Roboter erzwingt weite Umwege. Verschachtelte Key-Kette.",
        8:"SLAM-Falle: falsche Reihenfolge schneidet Container ab.",
        9:"Labyrinth — erst Orientierung gewinnen, dann Optimal-Route planen.",
        10:"Alle Systeme aktiv — maximale Konsequenz jedes Fehlers."
    }

    return {
        "name": f"ZONE X - {names.get(difficulty,'Level')}",
        "difficulty": difficulty,
        "cols": 36, "rows": 36,
        "playerStart": player_start,
        "robots": robots,
        "cameras": cameras_data,
        "warpPairs": warp_pairs_data,
        "map": g,
        "innovation": innovations.get(difficulty,""),
        "notes": (f"Difficulty {difficulty} level, seed={seed}. "
                  f"{len(plut_pos)} plutonium, {len(robots)} robots, "
                  f"{len(cameras_data)} cameras.")
    }

# ── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    difficulty = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    out_path = sys.argv[2] if len(sys.argv) > 2 else f"levels/{difficulty}.json"

    if difficulty not in range(1, 11):
        print("Difficulty must be 1-10"); sys.exit(1)

    out = pathlib.Path(out_path)

    # Derive a seed from the level number so every file gets a unique map
    try:
        level_num = int(out.stem)
    except ValueError:
        level_num = difficulty
    seed = level_num * 1000 + difficulty

    print(f"Building Zone X Level {level_num} (difficulty {difficulty}, seed={seed})...")
    level = build_level(difficulty, seed=seed)

    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(level, indent=2, ensure_ascii=False), encoding="utf-8")

    js_out = out.with_suffix(".js")
    payload = json.dumps(level, ensure_ascii=False)
    js_out.write_text(
        "(window.ZONE_LEVELS = window.ZONE_LEVELS || {})[" + str(level_num) + "] = " + payload + ";\n",
        encoding="utf-8"
    )

    print(f"Saved: {out}")
    print(f"Saved: {js_out}")
    print(f"  Name:       {level['name']}")
    print(f"  Map:        36x36")
    print(f"  Robots:     {len(level['robots'])}")
    print(f"  Cameras:    {len(level['cameras'])}")
    print(f"  Plutonium:  {sum(1 for r in level['map'] for t in r if t==2)}")
    print(f"  Innovation: {level['innovation'][:80]}...")
