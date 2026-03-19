// prisma/seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * ========== BASE NODES ==========
 */
const nodes = [
  { code: "main_building", name: "Main Building", lat: 12.926739, lng: 77.526795, type: "building", building: "Academic Block & Administration", floor: null },
  { code: "library", name: "Library", lat: 12.927555, lng: 77.527363, type: "building", building: "Library with study area", floor: null },
  { code: "canteen", name: "Canteen", lat: 12.925434082158953, lng: 77.52629165299633, type: "dining", building: "Canteen & Food Court", floor: null },
  { code: "admin", name: "Admin Block", lat: 12.927096255900626, lng: 77.5266644681782, type: "building", building: "Principal Office & Admin Department", floor: null },
  { code: "physical_ed", name: "Physical Education Dept", lat: 12.925816084951286, lng: 77.5256072025667, type: "sports", building: "Playground & Sports Facilities", floor: null },
  { code: "main_entrance", name: "Main Entrance", lat: 12.925149, lng: 77.526612, type: "gate", building: "Global Main Entrance", floor: null },
  { code: "parking", name: "Parking Lot", lat: 12.924498319274573, lng: 77.52620597909112, type: "parking", building: "Parking Area", floor: null },
  { code: "cricket_ground", name: "Cricket Ground", lat: 12.926341570762668, lng: 77.52573912178504, type: "sports", building: "Cricket Ground", floor: null },
  { code: "basketball_court", name: "Basketball Court", lat: 12.925785239471097, lng: 77.52648074851497, type: "sports", building: "Basketball Court", floor: null },
  { code: "volleyball_court", name: "Volleyball Court", lat: 12.925760404156964, lng: 77.52627287731568, type: "sports", building: "Volleyball Court", floor: null },
  { code: "auditorium", name: "Auditorium", lat: 12.927594289430477, lng: 77.52711911426056, type: "building", building: "Auditorium", floor: null },
  { code: "aib_block", name: "AIB Block", lat: 12.926815249290375, lng: 77.52708826885693, type: "building", building: "AIB Block", floor: null },
  { code: "a_block", name: "A Block", lat: 12.92746488528009, lng: 77.5273605130726, type: "building", building: "A Block", floor: null },
  { code: "b_block", name: "B Block", lat: 12.927535469370188, lng: 77.52715398297758, type: "building", building: "B Block", floor: null },
  { code: "c_block", name: "C Block", lat: 12.92790538196081, lng: 77.52719958053099, type: "building", building: "C Block", floor: null },
  { code: "quadrangle", name: "Quadrangle", lat: 12.926877990871688, lng: 77.52653036938116, type: "open_area", building: "Quadrangle", floor: null },
];

/**
 * ========== ROOMS / LABS ==========
 */
const roomDefs = {
  main_building: [
    // ground
    { code: "conference_room", name: "Conference Room", floor: 0, lat: 12.926967, lng: 77.52655 },
    { code: "principal_chamber", name: "Principal Chamber", floor: 0, lat: 12.927086, lng: 77.526581 },
    { code: "admission_department", name: "Admission Department", floor: 0, lat: 12.927078, lng: 77.526343 },
    // floor 2
    { code: "a_201", name: "A-201", floor: 2, lat: 12.927475, lng: 77.52731 },
    { code: "a_202", name: "A-202", floor: 2, lat: 12.927462, lng: 77.527325 },
    // floor 3
    { code: "a_301", name: "A-301", floor: 3, lat: 12.92749, lng: 77.5273 },
    { code: "a_302", name: "A-302", floor: 3, lat: 12.927498, lng: 77.527285 },
  ],
  aib_block: [
    { code: "cs_lab_1", name: "CS Lab 1", floor: 2, lat: 12.92684, lng: 77.52706, type: "lab" },
    { code: "cs_lab_2", name: "CS Lab 2", floor: 3, lat: 12.926855, lng: 77.52705, type: "lab" },
  ],
  b_block: [
    { code: "ece_lab", name: "ECE Lab", floor: 1, lat: 12.92754, lng: 77.52713, type: "lab" },
    { code: "b_204", name: "B-204", floor: 2, lat: 12.927545, lng: 77.527115 },
  ],
  c_block: [
    { code: "mech_lab", name: "Mechanical Lab", floor: 1, lat: 12.92789, lng: 77.52721, type: "lab" },
    { code: "c_102", name: "C-102", floor: 1, lat: 12.92788, lng: 77.52719 },
  ],
};

// add rooms to nodes
(function appendRoomsToNodes() {
  const byCodeBase = Object.fromEntries(nodes.map(n => [n.code, n]));
  for (const [buildingCode, rooms] of Object.entries(roomDefs)) {
    const buildingNode = byCodeBase[buildingCode];
    const buildingName = buildingNode?.name || buildingCode;
    rooms.forEach(r => {
      nodes.push({
        code: r.code,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        type: r.type || "room",
        building: buildingName,
        floor: r.floor ?? null,
      });
    });
  }
})();

/**
 * --- Geometry helpers (correct haversine) ---
 */
const toRad = d => (d * Math.PI) / 180;
function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2);
  return 2 * R * Math.asin(Math.sqrt(s));
}
const polyLen = coords =>
  Array.isArray(coords) && coords.length > 1
    ? coords.slice(1).reduce((L, p, i) => L + haversineMeters(coords[i], p), 0)
    : 0;

function edgesFootpaths(byCode) {
  const need = (code) => {
    const n = byCode[code];
    if (!n) throw new Error(`Missing node ${code}`);
    return { lat: n.lat, lng: n.lng };
  };
  const N = need;

  function midTowards(a, b, t = 0.4) {
    return { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
  }

  const E = [];

  // ===== outdoor examples (your existing list kept) =====
  E.push({
    from: "main_entrance", to: "main_building",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("main_entrance"),
      { lat: 12.925258521418684 ,lng: 77.52664060936388},
      { lat: 12.925376026993414, lng: 77.52667921698043 },
      { lat: 12.925638815036667, lng: 77.52675244703559 },
      { lat: 12.925974599364189, lng: 77.52687061371714 },
      { lat: 12.926300650377492, lng: 77.52688725691215 },
      { lat: 12.926569926018832, lng: 77.52693885081509 },
      { lat: 12.926824602109429, lng: 77.52690556442697 },
      N("main_building")
    ]
  });
  E.push({
    from:"main_building", to:"volleyball_court",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("main_building"),
    { lat:12.926788959378298,lng: 77.52693351511313},
    { lat:12.926589186446362,lng: 77.5269597318724},
    { lat:12.926359215082558,lng: 77.52693828179663},
    { lat:12.926182671265611,lng: 77.52688346493636},
    { lat:12.926036325638494,lng: 77.52688108159462},
    { lat:12.925878365182799,lng: 77.5268477148101},
    { lat:12.925731795108723,lng: 77.52681483175256},
    { lat:12.92574375399351,lng: 77.52663151228502},
    { lat:12.925762871615854,lng: 77.52647949881192},
    { lat:12.925762871615854, lng:77.52626128592313},
    N("volleyball_court")
    ]
  });

  E.push({
    from: "main_building", to: "library",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("main_building"),
      { lat:12.926829958179468,lng: 77.5268410529085 },
      { lat:12.926860608627559,lng: 77.52692908589322},
      { lat:12.926971633796668,lng: 77.52692655451243},
      { lat:12.927080191692045,lng: 77.52692149175085},
      { lat:12.927270167895367,lng: 77.52690124070462},
      { lat:12.92734911900227, lng:77.52689870932385},
      { lat:12.927413266758245,lng: 77.5269417427971},
      { lat:12.92743547174685, lng:77.52707084321693},
      N("library")
    ]
  });

  E.push({
    from: "library", to:"basketball_court",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("library"),
    { lat:12.927538701583833,lng: 77.52716441142765},
    { lat:12.927408076502012,lng: 77.52701211370943},
    { lat:12.927393826488947,lng: 77.52689514906186},
    { lat:12.927318525582034,lng: 77.5268914939186},
    { lat:12.92721284794373,lng: 77.52690926862343},
    { lat:12.927088113625897,lng: 77.5269146010348},
    { lat:12.926956449556108,lng: 77.52693059826892},
    { lat:12.926665027127083,lng: 77.52694374291981},
    { lat:12.926469079971108,lng: 77.52695751292251},
    { lat:12.926267764239741,lng: 77.52690794091282},
    { lat:12.92613073966131,lng: 77.52689416566194},
    { lat:12.926001872911641,lng: 77.52687212946377},
    { lat:12.925851528286294,lng: 77.52684182969126},
    { lat:12.92576024757673,lng: 77.52681428444353},
    { lat:12.925754878122193,lng: 77.52661871318467},
    { lat:12.925765617031166,lng: 77.52648649599557},
     N("basketball_court")
    ]
  });

  E.push({
    from: "library", to:"volleyball_court",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("library"),
    { lat:12.927538701583833,lng: 77.52716441142765},
    { lat:12.927408076502012,lng: 77.52701211370943},
    { lat:12.927393826488947,lng: 77.52689514906186},
    { lat:12.927318525582034,lng: 77.5268914939186},
    { lat:12.92721284794373,lng: 77.52690926862343},
    { lat:12.927088113625897,lng: 77.5269146010348},
    { lat:12.926956449556108,lng: 77.52693059826892},
    { lat:12.926665027127083,lng: 77.52694374291981},
    { lat:12.926469079971108,lng: 77.52695751292251},
    { lat:12.926267764239741,lng: 77.52690794091282},
    { lat:12.92613073966131,lng: 77.52689416566194},
    { lat:12.926001872911641,lng: 77.52687212946377},
    { lat:12.925851528286294,lng: 77.52684182969126},
    { lat:12.92576024757673,lng: 77.52681428444353},
    { lat:12.925754878122193,lng: 77.52661871318467},
    { lat:12.925765617031166,lng: 77.52648649599557},
    { lat:12.925797833755306,lng: 77.52635978785602},
    { lat:12.925768301758339,lng: 77.52625511591465},
    N("volleyball_court")
    ]
  });

  E.push({
    from: "library", to:"aib_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("library"),
    { lat:12.927491094832805,lng: 77.52716141827185},
    { lat:12.92740126843159,lng: 77.52690897362842},
    { lat:12.927315347495819,lng: 77.52689895598382},
    { lat:12.927190371536462,lng: 77.52691899127299},
    { lat:12.927055631760172,lng: 77.52692299833083},
    { lat:12.926885742368453,lng: 77.52693501949919},
    { lat:12.926792010243481,lng: 77.52694704067268},
    { lat:12.926792010243481,lng: 77.52702718182934},
     N("aib_block")
    ]
  });

   E.push({
    from: "library", to:"a_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("library"),
    { lat:12.92792962848467,lng: 77.52700636012318},
    { lat:12.927465603824832,lng: 77.52716461044383},
    { lat:12.927415279971955,lng: 77.52718405645778},
    { lat:12.927415933528566,lng: 77.52722026627691},
    { lat:12.927421161981277,lng: 77.52725580554383},
    { lat:12.927412665745555,lng: 77.52730810861593},
    { lat:12.927412665745555,lng: 77.52733090739093},
     N("a_block")
    ]
  });

    E.push({
    from: "library", to:"b_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("library"),
    { lat:12.927559171609197,lng: 77.52715320204452},
    { lat:12.92749662545915,lng: 77.52716988694213},
    { lat:12.927410311747497,lng: 77.52718913874558},
    { lat:12.927415315441744,lng: 77.52722250853826},
    { lat:12.927411562671066,lng: 77.52726229559875},
    { lat:12.927424071906428,lng: 77.52730464956636},
    { lat:12.927507883767166,lng: 77.52729438193785},
    { lat:12.927567928068015,lng: 77.52728796467002},
    { lat:12.927597950213025,lng: 77.52728283085578},
    { lat:12.927696773081493,lng: 77.52726614595943},
    { lat:12.927747254248382,lng: 77.52725929912238},
    N("b_block")
    ]
  });

   

  E.push({
    from: "canteen", to:"physical_ed",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("canteen"),
    { lat:12.92542006066149,lng :77.5264430035527},
    { lat:12.925434628713548,lng: 77.52637657345365},
    { lat:12.92543786605833,lng: 77.52633173313679},
    { lat:12.925458908798403,lng: 77.5262819105625},
    { lat:12.925479951536692,lng: 77.52619887293869},
    { lat:12.925530130367038,lng: 77.52614905036441},
    { lat:12.92554469841266,lng: 77.52610919230497},
    { lat:12.925572215829852,lng: 77.52603777994848},
    { lat:12.925591639887214,lng: 77.52596138533457},
    { lat:12.925606207929249,lng: 77.5259032589979},
    { lat:12.92562563198507,lng: 77.52586672243517},
    { lat:12.925675810786103,lng: 77.52572887997964},
    { lat:12.925698472177245,lng: 77.52567241439039},
    { lat:12.925725989577494,lng: 77.5256425208458},
    N("physical_ed")
    ]
  });

   E.push({
    from: "canteen", to:"cricket_ground",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("canteen"),
    { lat:12.925410625428613,lng: 77.52644052549415},
    { lat:12.925461982989509,lng: 77.52635804998526},
    { lat:12.925479846486482,lng: 77.52622059080379},
    { lat:12.925508874666324,lng: 77.52616331614485},
    { lat:12.925607123865385,lng: 77.52608771359503},
    { lat:12.925611409929477,lng: 77.52609539048784},
    { lat:12.925808592189739,lng: 77.52608619464405},
    { lat:12.925956478782737,lng: 77.52607699880025},
    { lat:12.926234262185021,lng: 77.52605861325017},
    { lat:12.926317157128981,lng: 77.52603102939383},
    { lat:12.926509831751865,lng: 77.52600114688423},
    { lat:12.926579284201434,lng: 77.52598505630438},
    { lat:12.926767477827363,lng: 77.52595287513692},
    { lat:12.927139383853188,lng: 77.5258908114631},
    { lat:12.927323096274026,lng: 77.52585863030036},
    { lat:12.927260365222157,lng: 77.52572990564356},
    { lat:12.927222278504397,lng: 77.52560347964132},
    { lat:12.927264846012106,lng: 77.52539660072858},
     N("cricket_ground")
    ]
  });

  E.push({
    from: "canteen", to:"admin",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("canteen"),
    { lat:12.925415683043173,lng: 77.52645605502444},
    { lat:12.925408427029002,lng: 77.52649824134961},
    { lat:12.925372146954992,lng: 77.52664713426202},
    { lat:12.92550759253775,lng: 77.52670172832991},
    { lat:12.925657550061514,lng: 77.52677369323756},
    { lat:12.926034862142222,lng: 77.52688536292187},
    { lat:12.92612677140884,lng: 77.52689280756749},
    { lat:12.926213843314427,lng: 77.52689032601894},
    { lat:12.926329939149312,lng: 77.52692010461057},
    { lat:12.926537944037426,lng: 77.52696229093576},
    { lat:12.926692738260298,lng: 77.52695484629012},
    { lat:12.926789484600848,lng: 77.5269349939018},
    { lat:12.926801577890775,lng: 77.5268481397029},
    { lat:12.926789484600848,lng: 77.52677121169816},
    { lat:12.926758042044277,lng: 77.52668187595071},
    { lat:12.926891068221277,lng: 77.5266818759518},
    { lat:12.927009582389118,lng: 77.52667443130618},
    { lat:12.92706763012427,lng: 77.52666698666054},
    { lat:12.927060374158112,lng: 77.5267141360828},
     N("admin")
    ]
  });


  E.push({
    from: "canteen", to:"auditorium",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("canteen"),
    { lat:12.925418101713678,lng: 77.52646846277487},
    { lat:12.925398752342264,lng: 77.52650320445443},
    { lat:12.92538424031274,lng: 77.52656028007085},
    { lat:12.925372146954139,lng: 77.52668932059494},
    { lat:12.925493080513695,lng: 77.52671165453181},
    { lat:12.925645456715328,lng: 77.52677121169675},
    { lat:12.925713179441747,lng: 77.52680099027924},
    { lat:12.925778483481963,lng: 77.52682580576464},
    { lat:12.925884904844251,lng: 77.52685062125005},
    { lat:12.926049374133099,lng: 77.52688784447815},
    { lat:12.926320264490272,lng: 77.52692010460916},
    { lat:12.92662017848496,lng: 77.52695484630534},
    { lat:12.926750786077115,lng: 77.52693995701969},
    { lat:12.926975721208835,lng: 77.52692754927698},
    { lat:12.927152283051944,lng: 77.52692258617991},
    { lat:12.927333682075764,lng: 77.52690273379159},
    { lat:12.927398985696325,lng: 77.52699206954742},
    { lat:12.927423172216551,lng: 77.52714344400837},
    { lat:12.927563453987624,lng: 77.52715088865399},
    N("auditorium")
    ]
  });

  E.push({
    from: "admin", to:"physical_ed",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("admin"),
    { lat:12.927105070001337,lng: 77.5266832493876},
    { lat:12.926973503804644,lng: 77.5266806534771},
    { lat:12.92685711826516,lng: 77.5266910371191},
    { lat:12.92679386523181,lng: 77.52680525718097},
    { lat:12.926801455596667,lng: 77.52687794267489},
    { lat:12.92679386523181,lng: 77.52695841590031},
    { lat:12.926680009731388,lng: 77.52694803225832},
    { lat:12.926548443310685,lng: 77.52694803225832},
    { lat:12.92636880441832,lng: 77.52693505271957},
    { lat:12.926216996814409,lng :77.52687534677813},
    { lat:12.925748922785289,lng: 77.52679746945991},
    { lat:12.925645187341685,lng: 77.52676631853394},
    { lat:12.925516150510223,lng: 77.526714400324},
    { lat:12.92536434238783,lng: 77.52666767393504},
    { lat:12.92540735469854,lng: 77.52654826205217},
    { lat:12.925417475241158,lng: 77.52647557655824},
    { lat:12.925452897137104,lng: 77.52640029515383},
    { lat:12.925465547813017,lng: 77.52631463010744},
    { lat:12.925478198488284,lng: 77.52629905464444},
    { lat:12.925508560106298,lng: 77.52619002640354},
    { lat:12.925554102526402,lng: 77.52610695726764},
    { lat:12.925586994270347,lng: 77.5260109085636},
    { lat:12.925625989449202,lng: 77.5259142448887},
    { lat:12.925667430596954,lng: 77.52575480044196},
    { lat:12.925703691595679,lng: 77.52568039303021},
    { lat:12.925741679302096,lng: 77.5256449609274},
     N("physical_ed")
    ]
  });

  E.push({
    from: "main_building", to: "admin",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("main_building"),
      { lat: 12.926829378543808, lng: 77.52684731324678 },
      { lat: 12.926835394078934, lng: 77.52671770221583 },
      { lat: 12.927013854888411, lng: 77.52669095708247 },
      { lat: 12.92713617065575,  lng: 77.52667244122046 },
      N("admin")
    ]
  });

  E.push({
    from: "admin", to: "library",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("admin"),
      { lat: 12.92714018100758,  lng: 77.52666832658454 },
      { lat: 12.926987787592427, lng: 77.52669918635382 },
      { lat: 12.926807321585736, lng: 77.52671564489744 },
      { lat: 12.926827373370703, lng: 77.52687611569765 },
      { lat: 12.926837399262583, lng: 77.52692137669258 },
      { lat: 12.927146196535224, lng: 77.52690491814897 },
      { lat: 12.927409745819011, lng: 77.5268997630143  },
      { lat: 12.927443660348928, lng: 77.52712427302845 },
      N("library")
    ]
  });
  E.push({
    from: "main_building", to: "cricket_ground",
     type: "footpath", bidirectional: true, accessible: true,
     pathCoords: [ N("main_building"),
     { lat:12.926799140124679,lng: 77.52692993772348},
     { lat:12.926799140124679,lng: 77.52692993772348},
     { lat:12.926536794372389,lng: 77.52694702770458},
     { lat:12.926024594728068,lng: 77.52688294027541},
     { lat:12.925749755461295,lng: 77.5267932178746},
     { lat:12.925524886745256,lng: 77.526737675436},
     { lat:12.925374974155364,lng: 77.52667358800683},
     { lat:12.92541245231127, lng: 77.52648132571935},
     { lat:12.925474915891954,lng: 77.52628051844131},
     { lat:12.925562364878658,lng: 77.52610534613495},
     { lat:12.925874682438254,lng: 77.526075438668},
     { lat:12.926195328059613,lng: 77.52605407619163},
     { lat:12.926549287033511,lng: 77.52600280624829},
     { lat:12.926799140124679,lng: 77.52594726380968},
     { lat:12.927078142447613,lng: 77.52590026636165},
     { lat:12.927875695981548,lng: 77.52576918646898},
    N("cricket_ground")
    ]
  });

  E.push({
    from:"main_building", to:"basketball_court",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("main_building"),
    { lat:12.926784291635101,lng: 77.52693048770811},
    { lat:12.926549809950338,lng: 77.52694875950199},
    { lat:12.926294551157037,lng: 77.52690917061526},
    { lat:12.92608678217911, lng:77.52690612531627},
    { lat:12.925911662477708,lng: 77.52685435523362},
    { lat:12.925727638252338,lng: 77.52681781164586},
    { lat:12.92573654265346,lng: 77.52667468259384},
    { lat:12.925742478920704,lng: 77.5265285082428},
    N("basketball_court")
    ] 
  });

  E.push({
     from:"main_building", to:"auditorium",
     type: "footpath", bidirectional: true, accessible: true,
     pathCoords: [ N("main_building"),
     { lat:12.926778355408798,lng:77.52693353302783},
     { lat:12.92701580499736,lng:77.52693353302783},
     { lat:12.927184987691419,lng:77.52692135183192},
     { lat:12.927363074613895,lng:77.52688785354314},
     { lat:12.927609427980574,lng:77.5271619304513},
     N("auditorium")
     ]
  });

  E.push({
    from:"library", to:"canteen",
    type: "footpath", bidirectional: true, accessible: true,
     pathCoords: [ N("library"),
     { lat:12.927416500659175,lng: 77.52690612535726},
     { lat:12.927226541311331,lng: 77.5269122159552},
     { lat:12.927226541311331,lng: 77.5269122159552},
     { lat:12.926855526543171,lng: 77.526945714244},
     { lat:12.926582459321514,lng: 77.52694875954296},
     { lat:12.926450968207021,lng: 77.52696778706536},
     { lat:12.92617471500688,lng: 77.52688992006944},
     { lat:12.925983462612319,lng: 77.52687434667025},
     { lat:12.925707208887491,lng: 77.52679959434876},
     { lat:12.925500777335582,lng: 77.52672795670955},
     { lat:12.92535809660645,lng: 77.52668123651199},
     { lat:12.925373275411287,lng: 77.5265566493185},
     N("canteen")
     ]
  });


  E.push({
    from: "main_building", to: "library",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("main_building"),
      { lat:12.926829958179468,lng: 77.5268410529085 },
      { lat:12.926860608627559,lng: 77.52692908589322},
      { lat:12.926971633796668,lng: 77.52692655451243},
      { lat:12.927080191692045,lng: 77.52692149175085},
      { lat:12.927270167895367,lng: 77.52690124070462},
      { lat:12.92734911900227, lng:77.52689870932385},
      { lat:12.927413266758245,lng: 77.5269417427971},
      { lat:12.92743547174685, lng:77.52707084321693},
      { lat:12.927447807850779,lng:77.52719488087519},
      { lat:12.927566234417496,lng:77.52716956706738},
      { lat:12.9276797264912,lng:77.5271543787827},
      N("library")
    ]
  });

  E.push({
    from: "main_building", to: "canteen",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("main_building"),
      { lat:12.926836326109695,lng:77.52686156415488},
      { lat:12.926831054595302,lng:77.5269372843698},
      { lat:12.926588564812752,lng:77.52696973589049},
      { lat:12.92645100875128,lng:77.52695346118955},
      { lat:12.926127164821269,lng:77.52688276673283},
      { lat:12.92589289448238,lng:77.52684741950448},
      { lat:12.925675849707492,lng:77.52676965560207},
      { lat:12.925489811178855,lng:77.52669542642252},
      { lat:12.925362340255107,lng:77.52667421808552},
      { lat:12.92538301122013, lng:77.52655050278625},
      { lat:12.925455359584253,lng:77.52637376664444},
      { lat:12.925481562580499,lng:77.52629508933495},
      N("canteen")
    ]
  });
  E.push({
    from:"main_entrance", to:"library",
    type: "footpath", bidirectional: true, accessible: true,
     pathCoords: [ N("main_entrance"),
     { lat:12.925267841791108,lng:77.526635912712},
     { lat:12.925385640520885,lng:77.526658225522},
     { lat:12.925452695158562,lng:77.52668797593547},
     { lat:12.92557913378676,lng:77.52674479463113},
     { lat:12.925769787603208,lng:77.52679449890597},
     { lat:12.925893243690377,lng:77.52684420318093},
     { lat:12.926049517126092,lng:77.52687466709195},
     { lat:12.926199539533476,lng:77.5268955108217},
     { lat:12.926492220728987,lng:77.52697489147607},
     { lat:12.926782203678354,lng:77.52694453198848},
     { lat:12.926983416139144,lng:77.5269263162959},
     { lat:12.927193505447189,lng:77.52691720844962},
     { lat:12.92736808656864,lng:77.5268959568083},
     {lat:12.927569298557168,lng:77.52729670204471},
     N("library")
     ]
  });

  E.push({
     from:"main_entrance", to:"physical_ed",
     type: "footpath", bidirectional: true, accessible: true,
     pathCoords: [ N("main_entrance"),
     { lat:12.925285986944811,lng:77.52664361163943},
     { lat:12.925345479498986,lng:77.52664750775439},
     { lat:12.925357743213288,lng:77.52656845300679},
     { lat:12.925424002958167,lng:77.52641305442498},
     { lat:12.925492042313053,lng:77.5262573285313},
     { lat:12.925504254502991,lng:77.52618573041926},
     { lat:12.92554089106922,lng:77.52611055240162},
     { lat:12.925568804639894,lng:77.52604253419518},
     { lat:12.925612419587795,lng:77.52593692697994},
     { lat:12.925649056138171,lng:77.52582058004786},
     { lat:12.925652545333152,lng:77.52579194080306},
     { lat:12.925683948085885,lng:77.5256970733046},
     N("physical_ed")
     ]
  });

  E.push({
    from:"main_entrance", to:"basketball_court",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("main_entrance"),
    {lat:12.925263499792498,lng:77.52664037843584},
    {lat:12.925350729787377,lng:77.52667438753907},
    {lat:12.92542051376135,lng:77.52670481673668},
    {lat:12.925537401874045,lng:77.5267424057455},
    {lat:12.9256455669445,lng:77.52676388517911},
    {lat:12.92568743728177,lng:77.52663500857743},
    {lat:12.925732796805923,lng:77.52650971188137},
    N("basketball_court")
    ]
  });

  E.push({
    from:"main_entrance", to:"auditorium",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("main_entrance"),
    { lat:12.925286242129085,lng: 77.52664342698252},
    { lat:12.92547351660798,lng: 77.52672504522793},
    { lat:12.925691955160232,lng: 77.52678764474958},
    { lat:12.925864971249766,lng: 77.52683928523805},
    { lat:12.926034841475552,lng: 77.52689415325706},
    { lat:12.926267626421396,lng: 77.52689738078844},
    { lat:12.926487828193233,lng: 77.52695547633769},
    { lat:12.926802750297261,lng: 77.5269443530252},
    { lat:12.927028067596599,lng: 77.52691754999165},
    { lat:12.927237057370718,lng: 77.52690414847451},
    { lat:12.927354614044214,lng: 77.52690749885464},
    { lat:12.92753094894699,lng: 77.52733299702389},
    N("auditorium")
    ]
  });

  E.push({
    from: "main_entrance", to: "canteen",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("main_entrance"),
      { lat:12.925261728437501,lng: 77.52662914746317},
      {lat:12.925302902857183,lng: 77.52662713580523},
      {lat:12.925338195210474,lng: 77.52654666953407},
      {lat:12.925364991252511,lng: 77.52646620326466},
      {lat:12.9254087799004,lng: 77.52636830263697},
      N("canteen")
    ]
  });

  E.push({
    from: "main_building", to: "physical_ed",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("main_building"),
      { lat:12.926828294947299,lng:77.52692381447432},
      { lat:12.926719017050928,lng:77.52694827688036},
      { lat:12.92644880241084,lng:77.52694012274502 },
      { lat:12.926317668730096,lng:77.52692381447432 },
      { lat:12.926333563725368,lng:77.5269340071435},
      { lat:12.926252121329483,lng:77.52687369710243},
      { lat:12.926219607057849,lng:77.52687995203532},
      { lat:12.925806756962082,lng:77.52680767384727},
      { lat:12.925606553704267,lng:77.52675143115238},
      { lat:12.925461167904524,lng:77.526714751134},
      { lat:12.92536344953252,lng:77.5266585084391},
      { lat:12.925390,lng:77.526561},
      { lat:12.925394433410705,lng:77.52653379637654},
      { lat:12.925475468150873,lng:77.52628681758597},
      { lat:12.92549930189297,lng:77.52625747357123},
      { lat:12.925532669128087,lng:77.5261621055234},
      { lat:12.925549352743976,lng:77.52611075349763},
      { lat:12.925581209032815,lng:77.52601078985502},
      { lat:12.925645358447918,lng:77.52589547008027},
      { lat:12.925704756372296,lng:77.52577485544344},
      N("physical_ed")
    ]
  });

  E.push({
    from: "canteen", to: "basketball_court",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("canteen"),
      { lat: 12.925444756295203,lng:77.52640271332861 },
      { lat: 12.925493330985251,lng: 77.52639187909428 },
      { lat:12.925557745233553,lng: 77.5264319657613},
      { lat:12.925613711698107,lng:77.52646880215804},
      N("basketball_court")
    ]
  });

  E.push({
    from: "admin", to: "auditorium",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("admin"),
      { lat: 12.927150592540517, lng:77.52668164239446},
      {lat:12.927009968203112,lng: 77.52670749622642},
      {lat:12.926815695142055,lng: 77.52671166619932},
      {lat:12.926818946575283,lng: 77.52685010929734},
      {lat:12.926830326591169, lng:77.52691933084658},
      {lat:12.926983956756688, lng:77.5269159948684},
      {lat:12.927236883956624, lng:77.52689746515469},
      {lat:12.92741002242506, lng:77.52691080906772},
      {lat:12.92741896384509, lng:77.5270158923835},
      {lat:12.927423028127093,lng: 77.52710929977547},
      {lat:12.927649814943605,lng: 77.52713181762908},
      N("auditorium")
    ]
  });

  E.push({
    from: "main_building", to: "aib_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("main_building"), { lat:12.92682826242594,lng:77.52689087545653 }, { lat:12.92682826242594,lng:77.5269750859 }, N("aib_block") ]
  });

  E.push({
    from: "aib_block", to: "a_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("aib_block"),
      { lat:12.92684291890094, lng:77.52696305583663},
      { lat:12.927010002655235,lng:77.52693899570994 },
      { lat:12.927162429842307,lng:77.5269359881941},
      { lat:12.927725237111328,lng:77.5274081681807},
      N("a_block")
    ]
  });

  E.push({
    from: "aib_block", to: "b_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [
      N("aib_block"),
      { lat:12.92684291890094, lng:77.52696305583663},
      { lat:12.927010002655235,lng:77.52693899570994 },
      { lat:12.927162429842307,lng:77.5269359881941},
      { lat:12.927725237111328,lng:77.5274081681807},
      N("b_block")
    ]
  });

  E.push({
    from: "b_block", to: "c_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("b_block"), { lat: 12.92772, lng: 77.52717 }, N("c_block") ]
  });

  E.push({
    from: "a_block", to: "c_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("a_block"), { lat: 12.92768, lng: 77.52732 }, { lat: 12.92779, lng: 77.52726 }, N("c_block") ]
  });

  E.push({
    from: "quadrangle", to: "aib_block",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("quadrangle"),
       { lat: 12.92688247807651,lng: 77.52654468545133},
       {lat:12.926819887996277,lng: 77.52662308094018},
       {lat:12.926830455153945,lng: 77.5267757019465},
       {lat:12.926820700854696,lng: 77.52694833882317},
       {lat:12.926826390862287,lng: 77.52706176208477},
        N("aib_block") ]
  });

  E.push({
    from: "quadrangle", to: "library",
    type: "footpath", bidirectional: true, accessible: true,
    pathCoords: [ N("quadrangle"), 
      { lat: 12.92688247807651,lng: 77.52654468545133},
       
        N("library") ]
  });

  // indoor: building ↔ each room/lab
  for (const [buildingCode, rooms] of Object.entries(roomDefs)) {
    const b = N(buildingCode);
    rooms.forEach((r) => {
      const roomNode = N(r.code);
      const mid = midTowards(b, roomNode, 0.4);
      E.push({
        from: buildingCode,
        to: r.code,
        type: "footpath",
        bidirectional: true,
        accessible: true,
        pathCoords: [ b, mid, roomNode ],
      });
    });
  }

  // add computed length
  return E.map(e => ({ ...e, lengthMeters: polyLen(e.pathCoords) }));
}

/**
 * MAIN
 */
async function main() {
  console.log("➡  Upserting nodes...");

  for (const n of nodes) {
    // Only keep fields that definitely exist in your Node model
    const base = { name: n.name, lat: n.lat, lng: n.lng };

    await prisma.node.upsert({
      where: { code: n.code },
      update: base,
      create: { code: n.code, ...base },
    });
  }

  console.log("🧹  Clearing old edges...");
  await prisma.edge.deleteMany();

  const allNodes = await prisma.node.findMany();
  const byCode = Object.fromEntries(allNodes.map(n => [n.code, n]));

  console.log("🛠  Creating footpath edges...");
  const edges = edgesFootpaths(byCode);

  for (const e of edges) {
    const fromNode = byCode[e.from];
    const toNode   = byCode[e.to];

    if (!fromNode || !toNode) {
      console.warn(`⚠️  Skipping edge ${e.from} -> ${e.to}: node not found`);
      continue;
    }

    await prisma.edge.create({
      data: {
        from: { connect: { id: fromNode.id } },
        to:   { connect: { id: toNode.id } },
        type: e.type,
        bidirectional: e.bidirectional,
        accessible: e.accessible,
        lengthMeters: e.lengthMeters,
        pathCoords: e.pathCoords
      }
    });
  }

  console.log(`✅ Seed complete: ${Object.keys(byCode).length} nodes, ${edges.length} edges.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
