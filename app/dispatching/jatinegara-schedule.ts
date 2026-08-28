// Jatinegara dispatch schedule — generated from the real 168Railway
// working timetable (506 JNG calls, 410 stops in
// the full day window, 0 skipped — no corridor match).
// Source: data/timetable/stations/jatinegara.json + per-train files.
// Generated: 2026-08-28 by scripts/build-jng-schedule.ts — DO NOT EDIT BY HAND.

import type { ScheduleEntry } from "../lib/train-engine";

export const JATINEGARA_SCHEDULE: ScheduleEntry[] = [
	{
		"train_no": "25",
		"train_name": "Argo Merbabu (25)",
		"origin": "Semarang Tawang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:50:00",
				"dep_actual": "23:50:00",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "00:02:00",
				"dep_actual": "00:04:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "00:05:00",
				"dep_actual": "00:05:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5194B",
		"train_name": "(CL) Cikarang (5194B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "00:02:45",
				"dep_actual": "00:02:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "00:04:00",
				"dep_actual": "00:05:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "00:06:00",
				"dep_actual": "00:06:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6085A",
		"train_name": "(CL) Cikarang (6085A)",
		"origin": "Cikarang",
		"destination": "Jakarta Kota",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:57:15",
				"dep_actual": "23:57:15",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "00:06:00",
				"dep_actual": "00:07:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "00:08:00",
				"dep_actual": "00:08:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "107B",
		"train_name": "Senja Utama Yogyakarta (107B)",
		"origin": "Yogyakarta",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "00:19:45",
				"dep_actual": "00:19:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "00:21:00",
				"dep_actual": "00:23:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "00:24:00",
				"dep_actual": "00:24:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5198B",
		"train_name": "(CL) Cikarang (5198B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "00:19:45",
				"dep_actual": "00:19:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "00:21:00",
				"dep_actual": "00:22:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "00:23:00",
				"dep_actual": "00:23:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5205A",
		"train_name": "(CL) Cikarang (5205A)",
		"origin": "Cikarang",
		"destination": "Manggarai",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "00:19:45",
				"dep_actual": "00:19:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "00:21:00",
				"dep_actual": "00:22:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "00:23:00",
				"dep_actual": "00:23:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "271A",
		"train_name": "Airlangga (271A)",
		"origin": "Surabaya Pasarturi",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "00:44:45",
				"dep_actual": "00:44:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "00:46:00",
				"dep_actual": "00:48:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "00:49:00",
				"dep_actual": "00:49:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "127D",
		"train_name": "Pangandaran (127D)",
		"origin": "Banjar",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "00:52:45",
				"dep_actual": "00:52:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "00:54:00",
				"dep_actual": "00:56:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "00:57:00",
				"dep_actual": "00:57:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "2704",
		"train_name": "Bramnambo Service (2704)",
		"origin": "Kampung Bandan",
		"destination": "Solo Balapan",
		"trainType": "freight",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "01:17:45",
				"dep_actual": "01:17:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "01:19:00",
				"dep_actual": "01:24:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "01:25:00",
				"dep_actual": "01:25:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "151",
		"train_name": "Brantas (151)",
		"origin": "Blitar",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "01:26:45",
				"dep_actual": "01:26:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "01:28:00",
				"dep_actual": "01:30:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "01:31:00",
				"dep_actual": "01:31:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "91",
		"train_name": "Jayabaya (91)",
		"origin": "Surabaya Pasarturi",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "01:44:45",
				"dep_actual": "01:44:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "01:46:00",
				"dep_actual": "01:48:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "01:49:00",
				"dep_actual": "01:49:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "57F",
		"train_name": "Purwojaya (57F)",
		"origin": "Kroya",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "01:52:45",
				"dep_actual": "01:52:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "01:54:00",
				"dep_actual": "01:56:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "01:57:00",
				"dep_actual": "01:57:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "113B",
		"train_name": "Sawunggalih (113B)",
		"origin": "Kutoarjo",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "02:13:45",
				"dep_actual": "02:13:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "02:15:00",
				"dep_actual": "02:17:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "02:18:00",
				"dep_actual": "02:18:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "251B",
		"train_name": "Jayakarta (251B)",
		"origin": "Surabaya Gubeng",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "02:21:45",
				"dep_actual": "02:21:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "02:23:00",
				"dep_actual": "02:25:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "02:26:00",
				"dep_actual": "02:26:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "73B",
		"train_name": "Senja Utama Solo (73B)",
		"origin": "Solo Balapan",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "02:37:45",
				"dep_actual": "02:37:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "02:39:00",
				"dep_actual": "02:41:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "02:42:00",
				"dep_actual": "02:42:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "35",
		"train_name": "Gajayana (35)",
		"origin": "Malang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "02:46:45",
				"dep_actual": "02:46:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "02:48:00",
				"dep_actual": "02:50:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "02:51:00",
				"dep_actual": "02:51:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "19",
		"train_name": "Argo Sindoro (19)",
		"origin": "Semarang Tawang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "03:31:45",
				"dep_actual": "03:31:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "03:33:00",
				"dep_actual": "03:35:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "03:36:00",
				"dep_actual": "03:36:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "37",
		"train_name": "Brawijaya (37)",
		"origin": "Malang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "03:51:45",
				"dep_actual": "03:51:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "03:53:00",
				"dep_actual": "03:55:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "03:56:00",
				"dep_actual": "03:56:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "287A",
		"train_name": "Serayu (287A)",
		"origin": "Kroya",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "04:03:45",
				"dep_actual": "04:03:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "04:05:00",
				"dep_actual": "04:07:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "04:08:00",
				"dep_actual": "04:08:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "31",
		"train_name": "Pandalungan (31)",
		"origin": "Surabaya Pasarturi",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "04:10:45",
				"dep_actual": "04:10:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "04:12:00",
				"dep_actual": "04:14:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "04:15:00",
				"dep_actual": "04:15:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5002",
		"train_name": "(CL) Cikarang (5002)",
		"origin": "Manggarai",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "04:19:45",
				"dep_actual": "04:19:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "04:21:00",
				"dep_actual": "04:22:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "04:23:00",
				"dep_actual": "04:23:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "41",
		"train_name": "Sembrani (41)",
		"origin": "Surabaya Pasarturi",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "04:26:45",
				"dep_actual": "04:26:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "04:28:00",
				"dep_actual": "04:30:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "04:31:00",
				"dep_actual": "04:31:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5004",
		"train_name": "(CL) Cikarang (5004)",
		"origin": "Matraman",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "04:30:45",
				"dep_actual": "04:30:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "04:32:00",
				"dep_actual": "04:33:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "04:34:00",
				"dep_actual": "04:34:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5006",
		"train_name": "(CL) Cikarang (5006)",
		"origin": "Manggarai",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "04:39:45",
				"dep_actual": "04:39:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "04:41:00",
				"dep_actual": "04:42:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "04:43:00",
				"dep_actual": "04:43:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5021B",
		"train_name": "(CL) Cikarang (5021B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "04:46:45",
				"dep_actual": "04:46:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "04:48:00",
				"dep_actual": "04:49:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "04:50:00",
				"dep_actual": "04:50:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5500A",
		"train_name": "(CL) Cikarang (5500A)",
		"origin": "Jakarta Kota",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "04:46:45",
				"dep_actual": "04:46:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "04:48:00",
				"dep_actual": "04:49:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "04:50:00",
				"dep_actual": "04:50:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5008",
		"train_name": "(CL) Cikarang (5008)",
		"origin": "Manggarai",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "04:52:45",
				"dep_actual": "04:52:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "04:54:00",
				"dep_actual": "04:55:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "04:56:00",
				"dep_actual": "04:56:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5023B",
		"train_name": "(CL) Cikarang (5023B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "04:54:45",
				"dep_actual": "04:54:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "04:56:00",
				"dep_actual": "04:57:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "04:58:00",
				"dep_actual": "04:58:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5027B",
		"train_name": "(CL) Cikarang (5027B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:00:45",
				"dep_actual": "05:00:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:02:00",
				"dep_actual": "05:03:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:04:00",
				"dep_actual": "05:04:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5010",
		"train_name": "(CL) Cikarang (5010)",
		"origin": "Manggarai",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:01:45",
				"dep_actual": "05:01:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:03:00",
				"dep_actual": "05:04:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:05:00",
				"dep_actual": "05:05:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5505B",
		"train_name": "(CL) Cikarang (5505B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:08:45",
				"dep_actual": "05:08:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:10:00",
				"dep_actual": "05:11:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:12:00",
				"dep_actual": "05:12:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5012",
		"train_name": "(CL) Cikarang (5012)",
		"origin": "Manggarai",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:14:45",
				"dep_actual": "05:14:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:16:00",
				"dep_actual": "05:17:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:18:00",
				"dep_actual": "05:18:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5029B",
		"train_name": "(CL) Cikarang (5029B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:14:45",
				"dep_actual": "05:14:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:16:00",
				"dep_actual": "05:17:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:18:00",
				"dep_actual": "05:18:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "D1/13089",
		"train_name": "KLB Angkutan Balast (D1/13089)",
		"origin": "Klari",
		"destination": "Kampung Bandan",
		"trainType": "freight",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:17:45",
				"dep_actual": "05:17:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "05:19:00",
				"dep_actual": "05:30:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:31:00",
				"dep_actual": "05:31:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "149",
		"train_name": "Singasari (149)",
		"origin": "Blitar",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:19:45",
				"dep_actual": "05:19:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "05:21:00",
				"dep_actual": "05:23:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:24:00",
				"dep_actual": "05:24:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5014",
		"train_name": "(CL) Cikarang (5014)",
		"origin": "Manggarai",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:20:45",
				"dep_actual": "05:20:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:22:00",
				"dep_actual": "05:23:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:24:00",
				"dep_actual": "05:24:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6001",
		"train_name": "(CL) Cikarang (6001)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:23:45",
				"dep_actual": "05:23:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:25:00",
				"dep_actual": "05:26:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:27:00",
				"dep_actual": "05:27:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5016B",
		"train_name": "(CL) Cikarang (5016B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:26:45",
				"dep_actual": "05:26:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:28:00",
				"dep_actual": "05:29:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:30:00",
				"dep_actual": "05:30:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "7",
		"train_name": "Bima (7)",
		"origin": "Surabaya Gubeng",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:26:45",
				"dep_actual": "05:26:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "05:28:00",
				"dep_actual": "05:30:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:31:00",
				"dep_actual": "05:31:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5507B",
		"train_name": "(CL) Cikarang (5507B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:31:45",
				"dep_actual": "05:31:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:33:00",
				"dep_actual": "05:34:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:35:00",
				"dep_actual": "05:35:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5018B",
		"train_name": "(CL) Cikarang (5018B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:33:45",
				"dep_actual": "05:33:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:35:00",
				"dep_actual": "05:36:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:37:00",
				"dep_actual": "05:37:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "177B",
		"train_name": "Menoreh (177B)",
		"origin": "Semarang Tawang",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:35:45",
				"dep_actual": "05:35:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "05:37:00",
				"dep_actual": "05:39:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:40:00",
				"dep_actual": "05:40:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5502",
		"train_name": "(CL) Cikarang (5502)",
		"origin": "Jakarta Kota",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:37:45",
				"dep_actual": "05:37:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "05:39:00",
				"dep_actual": "05:40:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:41:00",
				"dep_actual": "05:41:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5031B",
		"train_name": "(CL) Cikarang (5031B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:42:45",
				"dep_actual": "05:42:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:44:00",
				"dep_actual": "05:45:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:46:00",
				"dep_actual": "05:46:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5020A",
		"train_name": "(CL) Cikarang (5020A)",
		"origin": "Manggarai",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:44:45",
				"dep_actual": "05:44:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:46:00",
				"dep_actual": "05:47:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:48:00",
				"dep_actual": "05:48:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6003",
		"train_name": "(CL) Cikarang (6003)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:48:45",
				"dep_actual": "05:48:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:50:00",
				"dep_actual": "05:51:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:52:00",
				"dep_actual": "05:52:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "74B",
		"train_name": "Fajar Utama Solo (74B)",
		"origin": "Pasar Senen",
		"destination": "Solo Balapan",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:48:45",
				"dep_actual": "05:48:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "05:50:00",
				"dep_actual": "05:52:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:53:00",
				"dep_actual": "05:53:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5033B",
		"train_name": "(CL) Cikarang (5033B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "05:53:45",
				"dep_actual": "05:53:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "05:55:00",
				"dep_actual": "05:56:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "05:57:00",
				"dep_actual": "05:57:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5504",
		"train_name": "(CL) Cikarang (5504)",
		"origin": "Jakarta Kota",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:53:45",
				"dep_actual": "05:53:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "05:55:00",
				"dep_actual": "05:56:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "05:57:00",
				"dep_actual": "05:57:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5022C",
		"train_name": "(CL) Cikarang (5022C)",
		"origin": "Angke",
		"destination": "Tambun",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "05:57:45",
				"dep_actual": "05:57:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "05:59:00",
				"dep_actual": "06:00:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:01:00",
				"dep_actual": "06:01:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5509B",
		"train_name": "(CL) Cikarang (5509B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:01:45",
				"dep_actual": "06:01:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:03:00",
				"dep_actual": "06:04:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:05:00",
				"dep_actual": "06:05:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5024C",
		"train_name": "(CL) Cikarang (5024C)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:02:45",
				"dep_actual": "06:02:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:04:00",
				"dep_actual": "06:05:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:06:00",
				"dep_actual": "06:06:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5026",
		"train_name": "(CL) Cikarang (5026)",
		"origin": "Manggarai",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:07:45",
				"dep_actual": "06:07:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:09:00",
				"dep_actual": "06:10:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:11:00",
				"dep_actual": "06:11:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5037B",
		"train_name": "(CL) Cikarang (5037B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:07:45",
				"dep_actual": "06:07:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:09:00",
				"dep_actual": "06:10:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:11:00",
				"dep_actual": "06:11:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "26",
		"train_name": "Argo Merbabu (26)",
		"origin": "Gambir",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:12:45",
				"dep_actual": "06:12:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:14:00",
				"dep_actual": "06:16:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:17:00",
				"dep_actual": "06:17:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "63B",
		"train_name": "Manahan (63B)",
		"origin": "Solo Balapan",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:14:45",
				"dep_actual": "06:14:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "06:16:00",
				"dep_actual": "06:18:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:19:00",
				"dep_actual": "06:19:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5506",
		"train_name": "(CL) Cikarang (5506)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:16:45",
				"dep_actual": "06:16:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "06:18:00",
				"dep_actual": "06:19:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:20:00",
				"dep_actual": "06:20:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5511C",
		"train_name": "(CL) Cikarang (5511C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:20:45",
				"dep_actual": "06:20:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:22:00",
				"dep_actual": "06:23:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:24:00",
				"dep_actual": "06:24:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6005",
		"train_name": "(CL) Cikarang (6005)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:21:45",
				"dep_actual": "06:21:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:23:00",
				"dep_actual": "06:24:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:25:00",
				"dep_actual": "06:25:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5039C",
		"train_name": "(CL) Cikarang (5039C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:27:45",
				"dep_actual": "06:27:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:29:00",
				"dep_actual": "06:30:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:31:00",
				"dep_actual": "06:31:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6002B",
		"train_name": "(CL) Cikarang (6002B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:27:45",
				"dep_actual": "06:27:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:29:00",
				"dep_actual": "06:30:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:31:00",
				"dep_actual": "06:31:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "245B",
		"train_name": "Majapahit (245B)",
		"origin": "Malang",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:29:45",
				"dep_actual": "06:29:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "06:31:00",
				"dep_actual": "06:33:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:34:00",
				"dep_actual": "06:34:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5041C",
		"train_name": "(CL) Cikarang (5041C)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:34:45",
				"dep_actual": "06:34:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:36:00",
				"dep_actual": "06:37:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:38:00",
				"dep_actual": "06:38:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5508",
		"train_name": "(CL) Cikarang (5508)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:34:45",
				"dep_actual": "06:34:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "06:36:00",
				"dep_actual": "06:37:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:38:00",
				"dep_actual": "06:38:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "114C",
		"train_name": "Sawunggalih (114C)",
		"origin": "Pasar Senen",
		"destination": "Kutoarjo",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:38:45",
				"dep_actual": "06:38:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "06:40:00",
				"dep_actual": "06:42:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:43:00",
				"dep_actual": "06:43:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5043C",
		"train_name": "(CL) Cikarang (5043C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:40:45",
				"dep_actual": "06:40:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:42:00",
				"dep_actual": "06:43:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:44:00",
				"dep_actual": "06:44:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5028B",
		"train_name": "(CL) Cikarang (5028B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:41:45",
				"dep_actual": "06:41:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:43:00",
				"dep_actual": "06:44:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:45:00",
				"dep_actual": "06:45:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "PLB 7005",
		"train_name": "Batavia (PLB 7005)",
		"origin": "Solo Balapan",
		"destination": "Gambir",
		"trainType": "intercity",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:46:45",
				"dep_actual": "06:46:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "06:48:00",
				"dep_actual": "06:50:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:51:00",
				"dep_actual": "06:51:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6007",
		"train_name": "(CL) Cikarang (6007)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:48:45",
				"dep_actual": "06:48:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:50:00",
				"dep_actual": "06:51:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:52:00",
				"dep_actual": "06:52:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "130B",
		"train_name": "Papandayan (130B)",
		"origin": "Gambir",
		"destination": "Garut",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:48:45",
				"dep_actual": "06:48:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:50:00",
				"dep_actual": "06:52:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:53:00",
				"dep_actual": "06:53:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5045B",
		"train_name": "(CL) Cikarang (5045B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "06:51:45",
				"dep_actual": "06:51:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "06:53:00",
				"dep_actual": "06:54:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "06:55:00",
				"dep_actual": "06:55:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6004C",
		"train_name": "(CL) Cikarang (6004C)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:54:45",
				"dep_actual": "06:54:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "06:56:00",
				"dep_actual": "06:57:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:58:00",
				"dep_actual": "06:58:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "178B",
		"train_name": "Tawangjaya Premium (178B)",
		"origin": "Pasar Senen",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:54:45",
				"dep_actual": "06:54:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "06:56:00",
				"dep_actual": "06:58:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "06:59:00",
				"dep_actual": "06:59:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5030C",
		"train_name": "(CL) Cikarang (5030C)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "06:58:45",
				"dep_actual": "06:58:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:00:00",
				"dep_actual": "07:01:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:02:00",
				"dep_actual": "07:02:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5049B",
		"train_name": "(CL) Cikarang (5049B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:00:45",
				"dep_actual": "07:00:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:02:00",
				"dep_actual": "07:03:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:04:00",
				"dep_actual": "07:04:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5034C",
		"train_name": "(CL) Cikarang (5034C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:03:45",
				"dep_actual": "07:03:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:05:00",
				"dep_actual": "07:06:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:07:00",
				"dep_actual": "07:07:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5515B",
		"train_name": "(CL) Cikarang (5515B)",
		"origin": "Tambun",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:05:45",
				"dep_actual": "07:05:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:07:00",
				"dep_actual": "07:08:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:09:00",
				"dep_actual": "07:09:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5510",
		"train_name": "(CL) Cikarang (5510)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:07:45",
				"dep_actual": "07:07:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "07:09:00",
				"dep_actual": "07:10:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:11:00",
				"dep_actual": "07:11:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5051B",
		"train_name": "(CL) Cikarang (5051B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:14:45",
				"dep_actual": "07:14:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:16:00",
				"dep_actual": "07:17:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:18:00",
				"dep_actual": "07:18:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6009",
		"train_name": "(CL) Cikarang (6009)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:17:45",
				"dep_actual": "07:17:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:19:00",
				"dep_actual": "07:20:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:21:00",
				"dep_actual": "07:21:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5036C",
		"train_name": "(CL) Cikarang (5036C)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:18:45",
				"dep_actual": "07:18:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:20:00",
				"dep_actual": "07:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:22:00",
				"dep_actual": "07:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "281",
		"train_name": "Bengawan (281)",
		"origin": "Purwosari",
		"destination": "Pasar Senen",
		"trainType": "local",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:20:45",
				"dep_actual": "07:20:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "07:22:00",
				"dep_actual": "07:24:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:25:00",
				"dep_actual": "07:25:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5053B",
		"train_name": "(CL) Cikarang (5053B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:21:45",
				"dep_actual": "07:21:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:23:00",
				"dep_actual": "07:24:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:25:00",
				"dep_actual": "07:25:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6006B",
		"train_name": "(CL) Cikarang (6006B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:23:45",
				"dep_actual": "07:23:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:25:00",
				"dep_actual": "07:26:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:27:00",
				"dep_actual": "07:27:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "20A",
		"train_name": "Argo Muria (20A)",
		"origin": "Gambir",
		"destination": "Semarang Tawang",
		"trainType": "intercity",
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:28:45",
				"dep_actual": "07:28:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:30:00",
				"dep_actual": "07:32:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:33:00",
				"dep_actual": "07:33:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5517B",
		"train_name": "(CL) Cikarang (5517B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:30:45",
				"dep_actual": "07:30:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:32:00",
				"dep_actual": "07:33:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:34:00",
				"dep_actual": "07:34:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "255B",
		"train_name": "Jaka Tingkir (255B)",
		"origin": "Solo Balapan",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:30:45",
				"dep_actual": "07:30:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "07:32:00",
				"dep_actual": "07:34:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:35:00",
				"dep_actual": "07:35:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5512",
		"train_name": "(CL) Cikarang (5512)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:32:45",
				"dep_actual": "07:32:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "07:34:00",
				"dep_actual": "07:35:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:36:00",
				"dep_actual": "07:36:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6011",
		"train_name": "(CL) Cikarang (6011)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:37:45",
				"dep_actual": "07:37:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:39:00",
				"dep_actual": "07:40:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:41:00",
				"dep_actual": "07:41:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5038C",
		"train_name": "(CL) Cikarang (5038C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:39:45",
				"dep_actual": "07:39:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:41:00",
				"dep_actual": "07:42:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:43:00",
				"dep_actual": "07:43:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "131B",
		"train_name": "Parahyangan (131B)",
		"origin": "Bandung",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:43:45",
				"dep_actual": "07:43:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "07:45:00",
				"dep_actual": "07:48:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:49:00",
				"dep_actual": "07:49:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5055C",
		"train_name": "(CL) Cikarang (5055C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:47:45",
				"dep_actual": "07:47:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:49:00",
				"dep_actual": "07:50:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:51:00",
				"dep_actual": "07:51:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5044D",
		"train_name": "(CL) Cikarang (5044D)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:51:45",
				"dep_actual": "07:51:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "07:53:00",
				"dep_actual": "07:54:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:55:00",
				"dep_actual": "07:55:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5057B",
		"train_name": "(CL) Cikarang (5057B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:52:45",
				"dep_actual": "07:52:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "07:54:00",
				"dep_actual": "07:55:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:56:00",
				"dep_actual": "07:56:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5514A",
		"train_name": "(CL) Cikarang (5514A)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:52:45",
				"dep_actual": "07:52:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "07:54:00",
				"dep_actual": "07:55:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "07:56:00",
				"dep_actual": "07:56:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "PLB 7001A",
		"train_name": "Gajayana Tambahan (PLB 7001A)",
		"origin": "Malang",
		"destination": "Gambir",
		"trainType": "intercity",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "07:53:45",
				"dep_actual": "07:53:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "07:55:00",
				"dep_actual": "07:57:00",
				"line": "t4",
				"meets": [
					{
						"type": "susul",
						"with": "PLB 7001A"
					}
				]
			},
			{
				"station": "JNG-W",
				"arr_actual": "07:58:00",
				"dep_actual": "07:58:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6008B",
		"train_name": "(CL) Cikarang (6008B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "07:58:45",
				"dep_actual": "07:58:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:00:00",
				"dep_actual": "08:01:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:02:00",
				"dep_actual": "08:02:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5519C",
		"train_name": "(CL) Cikarang (5519C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:02:45",
				"dep_actual": "08:02:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:04:00",
				"dep_actual": "08:05:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:06:00",
				"dep_actual": "08:06:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "145",
		"train_name": "Blambangan Ekspres (145)",
		"origin": "Surabaya Pasarturi",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:02:45",
				"dep_actual": "08:02:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "08:04:00",
				"dep_actual": "08:06:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:07:00",
				"dep_actual": "08:07:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "106B",
		"train_name": "Gajahwong (106B)",
		"origin": "Pasar Senen",
		"destination": "Lempuyangan",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:03:45",
				"dep_actual": "08:03:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "08:05:00",
				"dep_actual": "08:07:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:08:00",
				"dep_actual": "08:08:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5046B",
		"train_name": "(CL) Cikarang (5046B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:04:45",
				"dep_actual": "08:04:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:06:00",
				"dep_actual": "08:07:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:08:00",
				"dep_actual": "08:08:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "117B",
		"train_name": "Gunungjati (117B)",
		"origin": "Cirebon",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:09:45",
				"dep_actual": "08:09:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "08:11:00",
				"dep_actual": "08:13:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:14:00",
				"dep_actual": "08:14:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5516",
		"train_name": "(CL) Cikarang (5516)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:10:45",
				"dep_actual": "08:10:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "08:12:00",
				"dep_actual": "08:13:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:14:00",
				"dep_actual": "08:14:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5059B",
		"train_name": "(CL) Cikarang (5059B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:14:45",
				"dep_actual": "08:14:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:16:00",
				"dep_actual": "08:17:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:18:00",
				"dep_actual": "08:18:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6013",
		"train_name": "(CL) Cikarang (6013)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:17:45",
				"dep_actual": "08:17:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:19:00",
				"dep_actual": "08:20:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:21:00",
				"dep_actual": "08:21:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "166A",
		"train_name": "Dharmawangsa Ekspres (166A)",
		"origin": "Pasar Senen",
		"destination": "Surabaya Pasarturi",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:17:45",
				"dep_actual": "08:17:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "08:19:00",
				"dep_actual": "08:21:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:22:00",
				"dep_actual": "08:22:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5048D",
		"train_name": "(CL) Cikarang (5048D)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:20:45",
				"dep_actual": "08:20:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:22:00",
				"dep_actual": "08:23:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:24:00",
				"dep_actual": "08:24:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5521B",
		"train_name": "(CL) Cikarang (5521B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:21:45",
				"dep_actual": "08:21:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:23:00",
				"dep_actual": "08:24:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:25:00",
				"dep_actual": "08:25:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5050C",
		"train_name": "(CL) Cikarang (5050C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:27:45",
				"dep_actual": "08:27:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:29:00",
				"dep_actual": "08:30:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:31:00",
				"dep_actual": "08:31:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5063C",
		"train_name": "(CL) Cikarang (5063C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:32:45",
				"dep_actual": "08:32:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:34:00",
				"dep_actual": "08:35:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:36:00",
				"dep_actual": "08:36:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5518",
		"train_name": "(CL) Cikarang (5518)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:36:45",
				"dep_actual": "08:36:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "08:38:00",
				"dep_actual": "08:39:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:40:00",
				"dep_actual": "08:40:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6015",
		"train_name": "(CL) Cikarang (6015)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:36:45",
				"dep_actual": "08:36:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:38:00",
				"dep_actual": "08:39:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:40:00",
				"dep_actual": "08:40:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "128B",
		"train_name": "Pangandaran (128B)",
		"origin": "Gambir",
		"destination": "Banjar",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:42:45",
				"dep_actual": "08:42:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:44:00",
				"dep_actual": "08:46:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:47:00",
				"dep_actual": "08:47:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5065B",
		"train_name": "(CL) Cikarang (5065B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:43:45",
				"dep_actual": "08:43:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:45:00",
				"dep_actual": "08:46:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:47:00",
				"dep_actual": "08:47:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5052C",
		"train_name": "(CL) Cikarang (5052C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:45:45",
				"dep_actual": "08:45:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:47:00",
				"dep_actual": "08:48:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:49:00",
				"dep_actual": "08:49:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "253",
		"train_name": "Kertajaya (253)",
		"origin": "Surabaya Pasarturi",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:48:45",
				"dep_actual": "08:48:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "08:50:00",
				"dep_actual": "08:52:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:53:00",
				"dep_actual": "08:53:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5054B",
		"train_name": "(CL) Cikarang (5054B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:49:45",
				"dep_actual": "08:49:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:51:00",
				"dep_actual": "08:52:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "08:53:00",
				"dep_actual": "08:53:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5067B",
		"train_name": "(CL) Cikarang (5067B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "08:51:45",
				"dep_actual": "08:51:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "08:53:00",
				"dep_actual": "08:54:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "08:55:00",
				"dep_actual": "08:55:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5056B",
		"train_name": "(CL) Cikarang (5056B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "08:57:45",
				"dep_actual": "08:57:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "08:59:00",
				"dep_actual": "09:00:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:01:00",
				"dep_actual": "09:01:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "D1/11162",
		"train_name": "KLB Kirim Lokomotif (D1/11162)",
		"origin": "Kampung Bandan",
		"destination": "Jatinegara",
		"trainType": "kirim_rangkaian",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": null,
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:00:45",
				"dep_actual": "09:00:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "09:02:00",
				"dep_actual": "09:02:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:03:00",
				"dep_actual": "09:03:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5525B",
		"train_name": "(CL) Cikarang (5525B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:02:45",
				"dep_actual": "09:02:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:04:00",
				"dep_actual": "09:05:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:06:00",
				"dep_actual": "09:06:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "282",
		"train_name": "Bengawan (282)",
		"origin": "Pasar Senen",
		"destination": "Purwosari",
		"trainType": "local",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:04:45",
				"dep_actual": "09:04:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "09:06:00",
				"dep_actual": "09:08:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:09:00",
				"dep_actual": "09:09:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "165",
		"train_name": "Dharmawangsa Ekspres (165)",
		"origin": "Surabaya Pasarturi",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:06:45",
				"dep_actual": "09:06:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "09:08:00",
				"dep_actual": "09:10:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:11:00",
				"dep_actual": "09:11:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5069C",
		"train_name": "(CL) Cikarang (5069C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:07:45",
				"dep_actual": "09:07:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:09:00",
				"dep_actual": "09:10:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:11:00",
				"dep_actual": "09:11:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5520",
		"train_name": "(CL) Cikarang (5520)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:08:45",
				"dep_actual": "09:08:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "09:10:00",
				"dep_actual": "09:11:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:12:00",
				"dep_actual": "09:12:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6017",
		"train_name": "(CL) Cikarang (6017)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:17:45",
				"dep_actual": "09:17:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:19:00",
				"dep_actual": "09:20:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:21:00",
				"dep_actual": "09:21:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6014B",
		"train_name": "(CL) Cikarang (6014B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:19:45",
				"dep_actual": "09:19:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "09:21:00",
				"dep_actual": "09:22:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:23:00",
				"dep_actual": "09:23:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "135B",
		"train_name": "Parahyangan (135B)",
		"origin": "Bandung",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:22:45",
				"dep_actual": "09:22:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "09:24:00",
				"dep_actual": "09:26:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:27:00",
				"dep_actual": "09:27:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5522A",
		"train_name": "(CL) Cikarang (5522A)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:26:45",
				"dep_actual": "09:26:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "09:28:00",
				"dep_actual": "09:29:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:30:00",
				"dep_actual": "09:30:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5527B",
		"train_name": "(CL) Cikarang (5527B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:28:45",
				"dep_actual": "09:28:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:30:00",
				"dep_actual": "09:31:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:32:00",
				"dep_actual": "09:32:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "138B",
		"train_name": "Parahyangan (138B)",
		"origin": "Gambir",
		"destination": "Bandung",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:28:45",
				"dep_actual": "09:28:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "09:30:00",
				"dep_actual": "09:32:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:33:00",
				"dep_actual": "09:33:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5071B",
		"train_name": "(CL) Cikarang (5071B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:33:45",
				"dep_actual": "09:33:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:35:00",
				"dep_actual": "09:36:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:37:00",
				"dep_actual": "09:37:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5060B",
		"train_name": "(CL) Cikarang (5060B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:34:45",
				"dep_actual": "09:34:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "09:36:00",
				"dep_actual": "09:37:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:38:00",
				"dep_actual": "09:38:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5073B",
		"train_name": "(CL) Cikarang (5073B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:40:45",
				"dep_actual": "09:40:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:42:00",
				"dep_actual": "09:43:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:44:00",
				"dep_actual": "09:44:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6016B",
		"train_name": "(CL) Cikarang (6016B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:40:45",
				"dep_actual": "09:40:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "09:42:00",
				"dep_actual": "09:43:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:44:00",
				"dep_actual": "09:44:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5075B",
		"train_name": "(CL) Cikarang (5075B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:45:45",
				"dep_actual": "09:45:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:47:00",
				"dep_actual": "09:48:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:49:00",
				"dep_actual": "09:49:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5524",
		"train_name": "(CL) Cikarang (5524)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:45:45",
				"dep_actual": "09:45:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "09:47:00",
				"dep_actual": "09:48:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:49:00",
				"dep_actual": "09:49:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5062C",
		"train_name": "(CL) Cikarang (5062C)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:50:45",
				"dep_actual": "09:50:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "09:52:00",
				"dep_actual": "09:53:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "09:54:00",
				"dep_actual": "09:54:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6019",
		"train_name": "(CL) Cikarang (6019)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:50:45",
				"dep_actual": "09:50:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:52:00",
				"dep_actual": "09:53:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:54:00",
				"dep_actual": "09:54:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5077B",
		"train_name": "(CL) Cikarang (5077B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "09:55:45",
				"dep_actual": "09:55:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "09:57:00",
				"dep_actual": "09:58:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "09:59:00",
				"dep_actual": "09:59:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5064B",
		"train_name": "(CL) Cikarang (5064B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "09:57:45",
				"dep_actual": "09:57:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "09:59:00",
				"dep_actual": "10:00:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:01:00",
				"dep_actual": "10:01:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5529B",
		"train_name": "(CL) Cikarang (5529B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:00:45",
				"dep_actual": "10:00:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:02:00",
				"dep_actual": "10:03:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:04:00",
				"dep_actual": "10:04:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5526",
		"train_name": "(CL) Cikarang (5526)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:06:45",
				"dep_actual": "10:06:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "10:08:00",
				"dep_actual": "10:09:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:10:00",
				"dep_actual": "10:10:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5066B",
		"train_name": "(CL) Cikarang (5066B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:11:45",
				"dep_actual": "10:11:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:13:00",
				"dep_actual": "10:14:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:15:00",
				"dep_actual": "10:15:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5079B",
		"train_name": "(CL) Cikarang (5079B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:12:45",
				"dep_actual": "10:12:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:14:00",
				"dep_actual": "10:15:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:16:00",
				"dep_actual": "10:16:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6021",
		"train_name": "(CL) Cikarang (6021)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:15:45",
				"dep_actual": "10:15:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:17:00",
				"dep_actual": "10:18:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:19:00",
				"dep_actual": "10:19:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "136B",
		"train_name": "Parahyangan (136B)",
		"origin": "Gambir",
		"destination": "Bandung",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:17:45",
				"dep_actual": "10:17:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:19:00",
				"dep_actual": "10:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:22:00",
				"dep_actual": "10:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6018C",
		"train_name": "(CL) Cikarang (6018C)",
		"origin": "Kampung Bandan",
		"destination": "Tambun",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:23:45",
				"dep_actual": "10:23:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:25:00",
				"dep_actual": "10:26:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:27:00",
				"dep_actual": "10:27:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5531C",
		"train_name": "(CL) Cikarang (5531C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:26:45",
				"dep_actual": "10:26:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:28:00",
				"dep_actual": "10:29:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:30:00",
				"dep_actual": "10:30:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5068B",
		"train_name": "(CL) Cikarang (5068B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:28:45",
				"dep_actual": "10:28:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:30:00",
				"dep_actual": "10:31:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:32:00",
				"dep_actual": "10:32:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5081B",
		"train_name": "(CL) Cikarang (5081B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:32:45",
				"dep_actual": "10:32:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:34:00",
				"dep_actual": "10:35:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:36:00",
				"dep_actual": "10:36:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5528",
		"train_name": "(CL) Cikarang (5528)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:33:45",
				"dep_actual": "10:33:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "10:35:00",
				"dep_actual": "10:36:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:37:00",
				"dep_actual": "10:37:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5070B",
		"train_name": "(CL) Cikarang (5070B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:39:45",
				"dep_actual": "10:39:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:41:00",
				"dep_actual": "10:42:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:43:00",
				"dep_actual": "10:43:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5533C",
		"train_name": "(CL) Cikarang (5533C)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:42:45",
				"dep_actual": "10:42:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:44:00",
				"dep_actual": "10:45:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:46:00",
				"dep_actual": "10:46:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5072B",
		"train_name": "(CL) Cikarang (5072B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:48:45",
				"dep_actual": "10:48:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:50:00",
				"dep_actual": "10:51:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:52:00",
				"dep_actual": "10:52:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6023A",
		"train_name": "(CL) Cikarang (6023A)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:48:45",
				"dep_actual": "10:48:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:50:00",
				"dep_actual": "10:51:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:52:00",
				"dep_actual": "10:52:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "23",
		"train_name": "Argo Merbabu (23)",
		"origin": "Semarang Tawang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:51:45",
				"dep_actual": "10:51:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "10:53:00",
				"dep_actual": "10:55:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:56:00",
				"dep_actual": "10:56:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6020B",
		"train_name": "(CL) Cikarang (6020B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "10:54:45",
				"dep_actual": "10:54:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "10:56:00",
				"dep_actual": "10:57:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "10:58:00",
				"dep_actual": "10:58:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5085B",
		"train_name": "(CL) Cikarang (5085B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "10:55:45",
				"dep_actual": "10:55:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "10:57:00",
				"dep_actual": "10:58:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "10:59:00",
				"dep_actual": "10:59:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5530",
		"train_name": "(CL) Cikarang (5530)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:05:45",
				"dep_actual": "11:05:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "11:07:00",
				"dep_actual": "11:08:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:09:00",
				"dep_actual": "11:09:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5087B",
		"train_name": "(CL) Cikarang (5087B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:07:45",
				"dep_actual": "11:07:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:09:00",
				"dep_actual": "11:10:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:11:00",
				"dep_actual": "11:11:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5074B",
		"train_name": "(CL) Cikarang (5074B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:10:45",
				"dep_actual": "11:10:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "11:12:00",
				"dep_actual": "11:13:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:14:00",
				"dep_actual": "11:14:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6025D",
		"train_name": "(CL) Cikarang (6025D)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:11:45",
				"dep_actual": "11:11:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:13:00",
				"dep_actual": "11:14:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:15:00",
				"dep_actual": "11:15:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5089B",
		"train_name": "(CL) Cikarang (5089B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:15:45",
				"dep_actual": "11:15:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:17:00",
				"dep_actual": "11:18:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:19:00",
				"dep_actual": "11:19:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6022B",
		"train_name": "(CL) Cikarang (6022B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:18:45",
				"dep_actual": "11:18:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "11:20:00",
				"dep_actual": "11:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:22:00",
				"dep_actual": "11:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "299A",
		"train_name": "Cikuray (299A)",
		"origin": "Garut",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:21:45",
				"dep_actual": "11:21:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "11:23:00",
				"dep_actual": "11:25:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:26:00",
				"dep_actual": "11:26:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5091B",
		"train_name": "(CL) Cikarang (5091B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:22:45",
				"dep_actual": "11:22:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:24:00",
				"dep_actual": "11:25:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:26:00",
				"dep_actual": "11:26:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5078B",
		"train_name": "(CL) Cikarang (5078B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:24:45",
				"dep_actual": "11:24:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "11:26:00",
				"dep_actual": "11:27:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:28:00",
				"dep_actual": "11:28:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5532",
		"train_name": "(CL) Cikarang (5532)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:28:45",
				"dep_actual": "11:28:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "11:30:00",
				"dep_actual": "11:31:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:32:00",
				"dep_actual": "11:32:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5093B",
		"train_name": "(CL) Cikarang (5093B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:31:45",
				"dep_actual": "11:31:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:33:00",
				"dep_actual": "11:34:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:35:00",
				"dep_actual": "11:35:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5080B",
		"train_name": "(CL) Cikarang (5080B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:33:45",
				"dep_actual": "11:33:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "11:35:00",
				"dep_actual": "11:36:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:37:00",
				"dep_actual": "11:37:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5537B",
		"train_name": "(CL) Cikarang (5537B)",
		"origin": "Tambun",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:36:45",
				"dep_actual": "11:36:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:38:00",
				"dep_actual": "11:39:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:40:00",
				"dep_actual": "11:40:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5082C",
		"train_name": "(CL) Cikarang (5082C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:44:45",
				"dep_actual": "11:44:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "11:46:00",
				"dep_actual": "11:47:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:48:00",
				"dep_actual": "11:48:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5095B",
		"train_name": "(CL) Cikarang (5095B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:45:45",
				"dep_actual": "11:45:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:47:00",
				"dep_actual": "11:48:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:49:00",
				"dep_actual": "11:49:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5534",
		"train_name": "(CL) Cikarang (5534)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:45:45",
				"dep_actual": "11:45:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "11:47:00",
				"dep_actual": "11:48:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:49:00",
				"dep_actual": "11:49:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6027",
		"train_name": "(CL) Cikarang (6027)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:45:45",
				"dep_actual": "11:45:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:47:00",
				"dep_actual": "11:48:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:49:00",
				"dep_actual": "11:49:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "17",
		"train_name": "Argo Sindoro (17)",
		"origin": "Semarang Tawang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:50:45",
				"dep_actual": "11:50:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "11:52:00",
				"dep_actual": "11:54:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "11:55:00",
				"dep_actual": "11:55:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5084C",
		"train_name": "(CL) Cikarang (5084C)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:54:45",
				"dep_actual": "11:54:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "11:56:00",
				"dep_actual": "11:57:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "11:58:00",
				"dep_actual": "11:58:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5097B",
		"train_name": "(CL) Cikarang (5097B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "11:56:45",
				"dep_actual": "11:56:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "11:58:00",
				"dep_actual": "11:59:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:00:00",
				"dep_actual": "12:00:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "256B",
		"train_name": "Jaka Tingkir (256B)",
		"origin": "Pasar Senen",
		"destination": "Solo Balapan",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "11:58:45",
				"dep_actual": "11:58:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "12:00:00",
				"dep_actual": "12:02:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:03:00",
				"dep_actual": "12:03:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6024C",
		"train_name": "(CL) Cikarang (6024C)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:00:45",
				"dep_actual": "12:00:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:02:00",
				"dep_actual": "12:03:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:04:00",
				"dep_actual": "12:04:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5086B",
		"train_name": "(CL) Cikarang (5086B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:04:45",
				"dep_actual": "12:04:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:06:00",
				"dep_actual": "12:07:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:08:00",
				"dep_actual": "12:08:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5539B",
		"train_name": "(CL) Cikarang (5539B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:05:45",
				"dep_actual": "12:05:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:07:00",
				"dep_actual": "12:08:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:09:00",
				"dep_actual": "12:09:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5536",
		"train_name": "(CL) Cikarang (5536)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:09:45",
				"dep_actual": "12:09:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "12:11:00",
				"dep_actual": "12:12:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:13:00",
				"dep_actual": "12:13:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6029",
		"train_name": "(CL) Cikarang (6029)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:09:45",
				"dep_actual": "12:09:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:11:00",
				"dep_actual": "12:12:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:13:00",
				"dep_actual": "12:13:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "24",
		"train_name": "Argo Merbabu (24)",
		"origin": "Gambir",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:12:45",
				"dep_actual": "12:12:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:14:00",
				"dep_actual": "12:16:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:17:00",
				"dep_actual": "12:17:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5099C",
		"train_name": "(CL) Cikarang (5099C)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:15:45",
				"dep_actual": "12:15:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:17:00",
				"dep_actual": "12:18:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:19:00",
				"dep_actual": "12:19:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6026C",
		"train_name": "(CL) Cikarang (6026C)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:18:45",
				"dep_actual": "12:18:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:20:00",
				"dep_actual": "12:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:22:00",
				"dep_actual": "12:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "146",
		"train_name": "Blambangan Ekspres (146)",
		"origin": "Pasar Senen",
		"destination": "Surabaya Pasarturi",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:19:45",
				"dep_actual": "12:19:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "12:21:00",
				"dep_actual": "12:23:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:24:00",
				"dep_actual": "12:24:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5101C",
		"train_name": "(CL) Cikarang (5101C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:22:45",
				"dep_actual": "12:22:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:24:00",
				"dep_actual": "12:25:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:26:00",
				"dep_actual": "12:26:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5088B",
		"train_name": "(CL) Cikarang (5088B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:25:45",
				"dep_actual": "12:25:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:27:00",
				"dep_actual": "12:28:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:29:00",
				"dep_actual": "12:29:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "111B",
		"train_name": "Sawunggalih (111B)",
		"origin": "Kutoarjo",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:27:45",
				"dep_actual": "12:27:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "12:29:00",
				"dep_actual": "12:31:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:32:00",
				"dep_actual": "12:32:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5541C",
		"train_name": "(CL) Cikarang (5541C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:30:45",
				"dep_actual": "12:30:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:32:00",
				"dep_actual": "12:33:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:34:00",
				"dep_actual": "12:34:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "162",
		"train_name": "Bangunkarta (162)",
		"origin": "Pasar Senen",
		"destination": "Jombang",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:33:45",
				"dep_actual": "12:33:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "12:35:00",
				"dep_actual": "12:37:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:38:00",
				"dep_actual": "12:38:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5090C",
		"train_name": "(CL) Cikarang (5090C)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:34:45",
				"dep_actual": "12:34:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:36:00",
				"dep_actual": "12:37:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:38:00",
				"dep_actual": "12:38:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5538",
		"train_name": "(CL) Cikarang (5538)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:39:45",
				"dep_actual": "12:39:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "12:41:00",
				"dep_actual": "12:42:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:43:00",
				"dep_actual": "12:43:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5103B",
		"train_name": "(CL) Cikarang (5103B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:41:45",
				"dep_actual": "12:41:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:43:00",
				"dep_actual": "12:44:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:45:00",
				"dep_actual": "12:45:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6031",
		"train_name": "(CL) Cikarang (6031)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:44:45",
				"dep_actual": "12:44:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:46:00",
				"dep_actual": "12:47:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:48:00",
				"dep_actual": "12:48:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6028C",
		"train_name": "(CL) Cikarang (6028C)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:52:45",
				"dep_actual": "12:52:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:54:00",
				"dep_actual": "12:55:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:56:00",
				"dep_actual": "12:56:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6033",
		"train_name": "(CL) Cikarang (6033)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "12:52:45",
				"dep_actual": "12:52:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "12:54:00",
				"dep_actual": "12:55:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "12:56:00",
				"dep_actual": "12:56:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5092B",
		"train_name": "(CL) Cikarang (5092B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:53:45",
				"dep_actual": "12:53:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "12:55:00",
				"dep_actual": "12:56:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "12:57:00",
				"dep_actual": "12:57:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5094B",
		"train_name": "(CL) Cikarang (5094B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "12:59:45",
				"dep_actual": "12:59:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "13:01:00",
				"dep_actual": "13:02:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:03:00",
				"dep_actual": "13:03:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5543B",
		"train_name": "(CL) Cikarang (5543B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:01:45",
				"dep_actual": "13:01:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:03:00",
				"dep_actual": "13:04:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:05:00",
				"dep_actual": "13:05:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5107B",
		"train_name": "(CL) Cikarang (5107B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:06:45",
				"dep_actual": "13:06:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:08:00",
				"dep_actual": "13:09:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:10:00",
				"dep_actual": "13:10:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5540",
		"train_name": "(CL) Cikarang (5540)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:06:45",
				"dep_actual": "13:06:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "13:08:00",
				"dep_actual": "13:09:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:10:00",
				"dep_actual": "13:10:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6035C",
		"train_name": "(CL) Cikarang (6035C)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:11:45",
				"dep_actual": "13:11:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:13:00",
				"dep_actual": "13:14:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:15:00",
				"dep_actual": "13:15:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5098C",
		"train_name": "(CL) Cikarang (5098C)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:22:45",
				"dep_actual": "13:22:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "13:24:00",
				"dep_actual": "13:25:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:26:00",
				"dep_actual": "13:26:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5109B",
		"train_name": "(CL) Cikarang (5109B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:22:45",
				"dep_actual": "13:22:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:24:00",
				"dep_actual": "13:25:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:26:00",
				"dep_actual": "13:26:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6037",
		"train_name": "(CL) Cikarang (6037)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:27:45",
				"dep_actual": "13:27:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:29:00",
				"dep_actual": "13:30:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:31:00",
				"dep_actual": "13:31:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5100C",
		"train_name": "(CL) Cikarang (5100C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:31:45",
				"dep_actual": "13:31:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "13:33:00",
				"dep_actual": "13:34:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:35:00",
				"dep_actual": "13:35:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5542A",
		"train_name": "(CL) Cikarang (5542A)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:31:45",
				"dep_actual": "13:31:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "13:33:00",
				"dep_actual": "13:34:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:35:00",
				"dep_actual": "13:35:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5111C",
		"train_name": "(CL) Cikarang (5111C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:34:45",
				"dep_actual": "13:34:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:36:00",
				"dep_actual": "13:37:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:38:00",
				"dep_actual": "13:38:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5545B",
		"train_name": "(CL) Cikarang (5545B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:40:45",
				"dep_actual": "13:40:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "13:42:00",
				"dep_actual": "13:43:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "13:44:00",
				"dep_actual": "13:44:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5102B",
		"train_name": "(CL) Cikarang (5102B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:42:45",
				"dep_actual": "13:42:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "13:44:00",
				"dep_actual": "13:45:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:46:00",
				"dep_actual": "13:46:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "176B",
		"train_name": "Menoreh (176B)",
		"origin": "Pasar Senen",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:42:45",
				"dep_actual": "13:42:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "13:44:00",
				"dep_actual": "13:46:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:47:00",
				"dep_actual": "13:47:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6032B",
		"train_name": "(CL) Cikarang (6032B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:47:45",
				"dep_actual": "13:47:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "13:49:00",
				"dep_actual": "13:50:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:51:00",
				"dep_actual": "13:51:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "142B",
		"train_name": "Parahyangan (142B)",
		"origin": "Gambir",
		"destination": "Bandung",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:52:45",
				"dep_actual": "13:52:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "13:54:00",
				"dep_actual": "13:56:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "13:57:00",
				"dep_actual": "13:57:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "133B",
		"train_name": "Parahyangan (133B)",
		"origin": "Bandung",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:55:45",
				"dep_actual": "13:55:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "13:57:00",
				"dep_actual": "13:59:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:00:00",
				"dep_actual": "14:00:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6034B",
		"train_name": "(CL) Cikarang (6034B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "13:58:45",
				"dep_actual": "13:58:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:00:00",
				"dep_actual": "14:01:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:02:00",
				"dep_actual": "14:02:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5115B",
		"train_name": "(CL) Cikarang (5115B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "13:59:45",
				"dep_actual": "13:59:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:01:00",
				"dep_actual": "14:02:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:03:00",
				"dep_actual": "14:03:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6039",
		"train_name": "(CL) Cikarang (6039)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:00:45",
				"dep_actual": "14:00:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:02:00",
				"dep_actual": "14:03:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:04:00",
				"dep_actual": "14:04:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5547B",
		"train_name": "(CL) Cikarang (5547B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:06:45",
				"dep_actual": "14:06:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:08:00",
				"dep_actual": "14:09:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:10:00",
				"dep_actual": "14:10:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5104C",
		"train_name": "(CL) Cikarang (5104C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:07:45",
				"dep_actual": "14:07:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:09:00",
				"dep_actual": "14:10:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:11:00",
				"dep_actual": "14:11:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5544",
		"train_name": "(CL) Cikarang (5544)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:07:45",
				"dep_actual": "14:07:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "14:09:00",
				"dep_actual": "14:10:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:11:00",
				"dep_actual": "14:11:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5117B",
		"train_name": "(CL) Cikarang (5117B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:12:45",
				"dep_actual": "14:12:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:14:00",
				"dep_actual": "14:15:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:16:00",
				"dep_actual": "14:16:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "109B",
		"train_name": "Fajar Utama Yogyakarta (109B)",
		"origin": "Yogyakarta",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:12:45",
				"dep_actual": "14:12:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "14:14:00",
				"dep_actual": "14:16:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:17:00",
				"dep_actual": "14:17:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6036C",
		"train_name": "(CL) Cikarang (6036C)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:18:45",
				"dep_actual": "14:18:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:20:00",
				"dep_actual": "14:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:22:00",
				"dep_actual": "14:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6041A",
		"train_name": "(CL) Cikarang (6041A)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:20:45",
				"dep_actual": "14:20:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:22:00",
				"dep_actual": "14:23:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:24:00",
				"dep_actual": "14:24:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5119C",
		"train_name": "(CL) Cikarang (5119C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:23:45",
				"dep_actual": "14:23:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:25:00",
				"dep_actual": "14:26:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:27:00",
				"dep_actual": "14:27:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5106B",
		"train_name": "(CL) Cikarang (5106B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:25:45",
				"dep_actual": "14:25:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:27:00",
				"dep_actual": "14:28:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:29:00",
				"dep_actual": "14:29:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5121B",
		"train_name": "(CL) Cikarang (5121B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:29:45",
				"dep_actual": "14:29:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:31:00",
				"dep_actual": "14:32:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:33:00",
				"dep_actual": "14:33:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6038B",
		"train_name": "(CL) Cikarang (6038B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:33:45",
				"dep_actual": "14:33:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:35:00",
				"dep_actual": "14:36:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:37:00",
				"dep_actual": "14:37:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5549B",
		"train_name": "(CL) Cikarang (5549B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:34:45",
				"dep_actual": "14:34:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:36:00",
				"dep_actual": "14:37:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:38:00",
				"dep_actual": "14:38:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "254B",
		"train_name": "Kertajaya (254B)",
		"origin": "Pasar Senen",
		"destination": "Surabaya Pasarturi",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:38:45",
				"dep_actual": "14:38:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "14:40:00",
				"dep_actual": "14:42:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:43:00",
				"dep_actual": "14:43:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5108B",
		"train_name": "(CL) Cikarang (5108B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:39:45",
				"dep_actual": "14:39:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:41:00",
				"dep_actual": "14:42:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:43:00",
				"dep_actual": "14:43:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5123B",
		"train_name": "(CL) Cikarang (5123B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:42:45",
				"dep_actual": "14:42:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:44:00",
				"dep_actual": "14:45:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:46:00",
				"dep_actual": "14:46:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5546",
		"train_name": "(CL) Cikarang (5546)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:43:45",
				"dep_actual": "14:43:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "14:45:00",
				"dep_actual": "14:46:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:47:00",
				"dep_actual": "14:47:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6043A",
		"train_name": "(CL) Cikarang (6043A)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:48:45",
				"dep_actual": "14:48:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:50:00",
				"dep_actual": "14:51:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:52:00",
				"dep_actual": "14:52:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5110B",
		"train_name": "(CL) Cikarang (5110B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:49:45",
				"dep_actual": "14:49:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:51:00",
				"dep_actual": "14:52:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:53:00",
				"dep_actual": "14:53:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5551B",
		"train_name": "(CL) Cikarang (5551B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:52:45",
				"dep_actual": "14:52:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:54:00",
				"dep_actual": "14:55:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "14:56:00",
				"dep_actual": "14:56:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5112B",
		"train_name": "(CL) Cikarang (5112B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "14:55:45",
				"dep_actual": "14:55:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "14:57:00",
				"dep_actual": "14:58:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "14:59:00",
				"dep_actual": "14:59:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6045",
		"train_name": "(CL) Cikarang (6045)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "14:57:45",
				"dep_actual": "14:57:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "14:59:00",
				"dep_actual": "15:00:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:01:00",
				"dep_actual": "15:01:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5125B",
		"train_name": "(CL) Cikarang (5125B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:01:45",
				"dep_actual": "15:01:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:03:00",
				"dep_actual": "15:04:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:05:00",
				"dep_actual": "15:05:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6040B",
		"train_name": "(CL) Cikarang (6040B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:03:45",
				"dep_actual": "15:03:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "15:05:00",
				"dep_actual": "15:06:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:07:00",
				"dep_actual": "15:07:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5114B",
		"train_name": "(CL) Cikarang (5114B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:09:45",
				"dep_actual": "15:09:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "15:11:00",
				"dep_actual": "15:12:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:13:00",
				"dep_actual": "15:13:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5548",
		"train_name": "(CL) Cikarang (5548)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:16:45",
				"dep_actual": "15:16:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "15:18:00",
				"dep_actual": "15:19:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:20:00",
				"dep_actual": "15:20:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6047A",
		"train_name": "(CL) Cikarang (6047A)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:16:45",
				"dep_actual": "15:16:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:18:00",
				"dep_actual": "15:19:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:20:00",
				"dep_actual": "15:20:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5116B",
		"train_name": "(CL) Cikarang (5116B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:23:45",
				"dep_actual": "15:23:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "15:25:00",
				"dep_actual": "15:26:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:27:00",
				"dep_actual": "15:27:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5553B",
		"train_name": "(CL) Cikarang (5553B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:24:45",
				"dep_actual": "15:24:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:26:00",
				"dep_actual": "15:27:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:28:00",
				"dep_actual": "15:28:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6042B",
		"train_name": "(CL) Cikarang (6042B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:29:45",
				"dep_actual": "15:29:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "15:31:00",
				"dep_actual": "15:32:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:33:00",
				"dep_actual": "15:33:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5129B",
		"train_name": "(CL) Cikarang (5129B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:34:45",
				"dep_actual": "15:34:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:36:00",
				"dep_actual": "15:37:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:38:00",
				"dep_actual": "15:38:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5131B",
		"train_name": "(CL) Cikarang (5131B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:39:45",
				"dep_actual": "15:39:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:41:00",
				"dep_actual": "15:42:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:43:00",
				"dep_actual": "15:43:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5550",
		"train_name": "(CL) Cikarang (5550)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:39:45",
				"dep_actual": "15:39:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "15:41:00",
				"dep_actual": "15:42:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:43:00",
				"dep_actual": "15:43:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5120B",
		"train_name": "(CL) Cikarang (5120B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:45:45",
				"dep_actual": "15:45:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "15:47:00",
				"dep_actual": "15:48:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:49:00",
				"dep_actual": "15:49:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5122C",
		"train_name": "(CL) Cikarang (5122C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "15:50:45",
				"dep_actual": "15:50:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "15:52:00",
				"dep_actual": "15:53:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "15:54:00",
				"dep_actual": "15:54:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6049A",
		"train_name": "(CL) Cikarang (6049A)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:50:45",
				"dep_actual": "15:50:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:52:00",
				"dep_actual": "15:53:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "15:54:00",
				"dep_actual": "15:54:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5555B",
		"train_name": "(CL) Cikarang (5555B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "15:56:45",
				"dep_actual": "15:56:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "15:58:00",
				"dep_actual": "15:59:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:00:00",
				"dep_actual": "16:00:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5552",
		"train_name": "(CL) Cikarang (5552)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:00:45",
				"dep_actual": "16:00:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "16:02:00",
				"dep_actual": "16:03:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:04:00",
				"dep_actual": "16:04:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "39",
		"train_name": "Sembrani (39)",
		"origin": "Surabaya Pasarturi",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:00:45",
				"dep_actual": "16:00:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "16:02:00",
				"dep_actual": "16:04:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:05:00",
				"dep_actual": "16:05:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6044B",
		"train_name": "(CL) Cikarang (6044B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:05:45",
				"dep_actual": "16:05:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "16:07:00",
				"dep_actual": "16:08:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:09:00",
				"dep_actual": "16:09:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5137C",
		"train_name": "(CL) Cikarang (5137C)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:06:45",
				"dep_actual": "16:06:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:08:00",
				"dep_actual": "16:09:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:10:00",
				"dep_actual": "16:10:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5124B",
		"train_name": "(CL) Cikarang (5124B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:11:45",
				"dep_actual": "16:11:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "16:13:00",
				"dep_actual": "16:14:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:15:00",
				"dep_actual": "16:15:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5133C",
		"train_name": "(CL) Cikarang (5133C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:11:45",
				"dep_actual": "16:11:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:13:00",
				"dep_actual": "16:14:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:15:00",
				"dep_actual": "16:15:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6051",
		"train_name": "(CL) Cikarang (6051)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:16:45",
				"dep_actual": "16:16:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:18:00",
				"dep_actual": "16:19:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:20:00",
				"dep_actual": "16:20:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6048B",
		"train_name": "(CL) Cikarang (6048B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:20:45",
				"dep_actual": "16:20:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "16:22:00",
				"dep_actual": "16:23:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:24:00",
				"dep_actual": "16:24:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "75B",
		"train_name": "Mataram (75B)",
		"origin": "Solo Balapan",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:20:45",
				"dep_actual": "16:20:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "16:22:00",
				"dep_actual": "16:24:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:25:00",
				"dep_actual": "16:25:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5139B",
		"train_name": "(CL) Cikarang (5139B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:23:45",
				"dep_actual": "16:23:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:25:00",
				"dep_actual": "16:26:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:27:00",
				"dep_actual": "16:27:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5554",
		"train_name": "(CL) Cikarang (5554)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:28:45",
				"dep_actual": "16:28:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "16:30:00",
				"dep_actual": "16:31:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:32:00",
				"dep_actual": "16:32:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5557B",
		"train_name": "(CL) Cikarang (5557B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:30:45",
				"dep_actual": "16:30:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:32:00",
				"dep_actual": "16:33:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:34:00",
				"dep_actual": "16:34:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5126C",
		"train_name": "(CL) Cikarang (5126C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:38:45",
				"dep_actual": "16:38:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "16:40:00",
				"dep_actual": "16:41:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:42:00",
				"dep_actual": "16:42:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5141B",
		"train_name": "(CL) Cikarang (5141B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:40:45",
				"dep_actual": "16:40:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:42:00",
				"dep_actual": "16:43:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:44:00",
				"dep_actual": "16:44:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6053",
		"train_name": "(CL) Cikarang (6053)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:41:45",
				"dep_actual": "16:41:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:43:00",
				"dep_actual": "16:44:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:45:00",
				"dep_actual": "16:45:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5128B",
		"train_name": "(CL) Cikarang (5128B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:42:45",
				"dep_actual": "16:42:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "16:44:00",
				"dep_actual": "16:45:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:46:00",
				"dep_actual": "16:46:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5143B",
		"train_name": "(CL) Cikarang (5143B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:46:45",
				"dep_actual": "16:46:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:48:00",
				"dep_actual": "16:49:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:50:00",
				"dep_actual": "16:50:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "143B",
		"train_name": "Madiun Jaya (143B)",
		"origin": "Madiun",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:49:45",
				"dep_actual": "16:49:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "16:51:00",
				"dep_actual": "16:53:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:54:00",
				"dep_actual": "16:54:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5145B",
		"train_name": "(CL) Cikarang (5145B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "16:51:45",
				"dep_actual": "16:51:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "16:53:00",
				"dep_actual": "16:54:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "16:55:00",
				"dep_actual": "16:55:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6050C",
		"train_name": "(CL) Cikarang (6050C)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:54:45",
				"dep_actual": "16:54:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "16:56:00",
				"dep_actual": "16:57:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "16:58:00",
				"dep_actual": "16:58:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "18",
		"train_name": "Argo Sindoro (18)",
		"origin": "Gambir",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "16:58:45",
				"dep_actual": "16:58:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:00:00",
				"dep_actual": "17:02:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:03:00",
				"dep_actual": "17:03:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6055",
		"train_name": "(CL) Cikarang (6055)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:01:45",
				"dep_actual": "17:01:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:03:00",
				"dep_actual": "17:04:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:05:00",
				"dep_actual": "17:05:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5556",
		"train_name": "(CL) Cikarang (5556)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:02:45",
				"dep_actual": "17:02:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "17:04:00",
				"dep_actual": "17:05:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:06:00",
				"dep_actual": "17:06:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5147C",
		"train_name": "(CL) Cikarang (5147C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:07:45",
				"dep_actual": "17:07:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:09:00",
				"dep_actual": "17:10:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:11:00",
				"dep_actual": "17:11:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "283A",
		"train_name": "Serayu (283A)",
		"origin": "Kroya",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:07:45",
				"dep_actual": "17:07:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "17:09:00",
				"dep_actual": "17:11:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:12:00",
				"dep_actual": "17:12:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5132B",
		"train_name": "(CL) Cikarang (5132B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:08:45",
				"dep_actual": "17:08:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:10:00",
				"dep_actual": "17:11:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:12:00",
				"dep_actual": "17:12:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5134B",
		"train_name": "(CL) Cikarang (5134B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:13:15",
				"dep_actual": "17:13:15",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:14:00",
				"dep_actual": "17:15:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:16:00",
				"dep_actual": "17:16:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "252B",
		"train_name": "Jayakarta (252B)",
		"origin": "Pasar Senen",
		"destination": "Surabaya Gubeng",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:18:45",
				"dep_actual": "17:18:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "17:20:00",
				"dep_actual": "17:22:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:23:00",
				"dep_actual": "17:23:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6057",
		"train_name": "(CL) Cikarang (6057)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:20:45",
				"dep_actual": "17:20:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:22:00",
				"dep_actual": "17:23:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:24:00",
				"dep_actual": "17:24:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5149B",
		"train_name": "(CL) Cikarang (5149B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:23:45",
				"dep_actual": "17:23:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:25:00",
				"dep_actual": "17:26:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:27:00",
				"dep_actual": "17:27:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6052C",
		"train_name": "(CL) Cikarang (6052C)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:23:45",
				"dep_actual": "17:23:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:25:00",
				"dep_actual": "17:26:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:27:00",
				"dep_actual": "17:27:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5136B",
		"train_name": "(CL) Cikarang (5136B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:28:45",
				"dep_actual": "17:28:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:30:00",
				"dep_actual": "17:31:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:32:00",
				"dep_actual": "17:32:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5151C",
		"train_name": "(CL) Cikarang (5151C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:32:45",
				"dep_actual": "17:32:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:34:00",
				"dep_actual": "17:35:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:36:00",
				"dep_actual": "17:36:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5558",
		"train_name": "(CL) Cikarang (5558)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:32:45",
				"dep_actual": "17:32:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "17:34:00",
				"dep_actual": "17:35:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:36:00",
				"dep_actual": "17:36:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "259B",
		"train_name": "Tawang Jaya (259B)",
		"origin": "Semarang Poncol",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:34:45",
				"dep_actual": "17:34:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "17:36:00",
				"dep_actual": "17:38:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:39:00",
				"dep_actual": "17:39:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5561B",
		"train_name": "(CL) Cikarang (5561B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:37:45",
				"dep_actual": "17:37:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:39:00",
				"dep_actual": "17:40:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:41:00",
				"dep_actual": "17:41:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5138B",
		"train_name": "(CL) Cikarang (5138B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:41:45",
				"dep_actual": "17:41:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:43:00",
				"dep_actual": "17:44:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:45:00",
				"dep_actual": "17:45:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "129B",
		"train_name": "Papandayan (129B)",
		"origin": "Garut",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:42:45",
				"dep_actual": "17:42:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "17:44:00",
				"dep_actual": "17:46:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:47:00",
				"dep_actual": "17:47:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6054B",
		"train_name": "(CL) Cikarang (6054B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:48:45",
				"dep_actual": "17:48:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:50:00",
				"dep_actual": "17:51:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:52:00",
				"dep_actual": "17:52:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6059A",
		"train_name": "(CL) Cikarang (6059A)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:48:45",
				"dep_actual": "17:48:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:50:00",
				"dep_actual": "17:51:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:52:00",
				"dep_actual": "17:52:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5140B",
		"train_name": "(CL) Cikarang (5140B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:53:45",
				"dep_actual": "17:53:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:55:00",
				"dep_actual": "17:56:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:57:00",
				"dep_actual": "17:57:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5142B",
		"train_name": "(CL) Cikarang (5142B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "17:54:15",
				"dep_actual": "17:54:15",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "17:55:00",
				"dep_actual": "17:56:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "17:57:00",
				"dep_actual": "17:57:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5153B",
		"train_name": "(CL) Cikarang (5153B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "17:53:45",
				"dep_actual": "17:53:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "17:55:00",
				"dep_actual": "17:56:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "17:57:00",
				"dep_actual": "17:57:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5155B",
		"train_name": "(CL) Cikarang (5155B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:00:45",
				"dep_actual": "18:00:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:02:00",
				"dep_actual": "18:03:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:04:00",
				"dep_actual": "18:04:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6056B",
		"train_name": "(CL) Cikarang (6056B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:04:45",
				"dep_actual": "18:04:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:06:00",
				"dep_actual": "18:07:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:08:00",
				"dep_actual": "18:08:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6061",
		"train_name": "(CL) Cikarang (6061)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:04:45",
				"dep_actual": "18:04:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:06:00",
				"dep_actual": "18:07:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:08:00",
				"dep_actual": "18:08:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "2703",
		"train_name": "Bramnambo Service (2703)",
		"origin": "Solo Balapan",
		"destination": "Kampung Bandan",
		"trainType": "freight",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:07:45",
				"dep_actual": "18:07:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "18:09:00",
				"dep_actual": "18:14:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:15:00",
				"dep_actual": "18:15:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5560",
		"train_name": "(CL) Cikarang (5560)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:09:45",
				"dep_actual": "18:09:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "18:11:00",
				"dep_actual": "18:12:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:13:00",
				"dep_actual": "18:13:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5563B",
		"train_name": "(CL) Cikarang (5563B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:09:45",
				"dep_actual": "18:09:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:11:00",
				"dep_actual": "18:12:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:13:00",
				"dep_actual": "18:13:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5144B",
		"train_name": "(CL) Cikarang (5144B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:14:45",
				"dep_actual": "18:14:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:16:00",
				"dep_actual": "18:17:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:18:00",
				"dep_actual": "18:18:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5157B",
		"train_name": "(CL) Cikarang (5157B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:15:45",
				"dep_actual": "18:15:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:17:00",
				"dep_actual": "18:18:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:19:00",
				"dep_actual": "18:19:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "104B",
		"train_name": "Bogowonto (104B)",
		"origin": "Pasar Senen",
		"destination": "Lempuyangan",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:18:45",
				"dep_actual": "18:18:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "18:20:00",
				"dep_actual": "18:22:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:23:00",
				"dep_actual": "18:23:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5146C",
		"train_name": "(CL) Cikarang (5146C)",
		"origin": "Kampung Bandan",
		"destination": "Tambun",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:19:45",
				"dep_actual": "18:19:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:21:00",
				"dep_actual": "18:22:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:23:00",
				"dep_actual": "18:23:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "161",
		"train_name": "Bangunkarta (161)",
		"origin": "Jombang",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:19:45",
				"dep_actual": "18:19:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "18:21:00",
				"dep_actual": "18:23:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:24:00",
				"dep_actual": "18:24:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5159B",
		"train_name": "(CL) Cikarang (5159B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:20:45",
				"dep_actual": "18:20:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:22:00",
				"dep_actual": "18:23:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:24:00",
				"dep_actual": "18:24:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6058B",
		"train_name": "(CL) Cikarang (6058B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:27:45",
				"dep_actual": "18:27:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:29:00",
				"dep_actual": "18:30:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:31:00",
				"dep_actual": "18:31:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5148B",
		"train_name": "(CL) Cikarang (5148B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:32:45",
				"dep_actual": "18:32:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:34:00",
				"dep_actual": "18:35:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:36:00",
				"dep_actual": "18:36:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5161B",
		"train_name": "(CL) Cikarang (5161B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:32:45",
				"dep_actual": "18:32:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:34:00",
				"dep_actual": "18:35:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:36:00",
				"dep_actual": "18:36:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6063",
		"train_name": "(CL) Cikarang (6063)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:36:45",
				"dep_actual": "18:36:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:38:00",
				"dep_actual": "18:39:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:40:00",
				"dep_actual": "18:40:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "134B",
		"train_name": "Parahyangan (134B)",
		"origin": "Gambir",
		"destination": "Bandung",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:37:45",
				"dep_actual": "18:37:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:39:00",
				"dep_actual": "18:41:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:42:00",
				"dep_actual": "18:42:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5562",
		"train_name": "(CL) Cikarang (5562)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:41:45",
				"dep_actual": "18:41:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "18:43:00",
				"dep_actual": "18:44:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:45:00",
				"dep_actual": "18:45:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5565C",
		"train_name": "(CL) Cikarang (5565C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:44:45",
				"dep_actual": "18:44:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:46:00",
				"dep_actual": "18:47:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:48:00",
				"dep_actual": "18:48:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "89",
		"train_name": "Gayabaru Malam Selatan (89)",
		"origin": "Surabaya Gubeng",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:48:45",
				"dep_actual": "18:48:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "18:50:00",
				"dep_actual": "18:52:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:53:00",
				"dep_actual": "18:53:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5150B",
		"train_name": "(CL) Cikarang (5150B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:49:45",
				"dep_actual": "18:49:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:51:00",
				"dep_actual": "18:52:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "18:53:00",
				"dep_actual": "18:53:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5165B",
		"train_name": "(CL) Cikarang (5165B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:51:45",
				"dep_actual": "18:51:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "18:53:00",
				"dep_actual": "18:54:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "18:55:00",
				"dep_actual": "18:55:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "27",
		"train_name": "Argo Merbabu (27)",
		"origin": "Semarang Tawang",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "18:55:45",
				"dep_actual": "18:55:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "18:57:00",
				"dep_actual": "18:59:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:00:00",
				"dep_actual": "19:00:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6060B",
		"train_name": "(CL) Cikarang (6060B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "18:56:45",
				"dep_actual": "18:56:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "18:58:00",
				"dep_actual": "18:59:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:00:00",
				"dep_actual": "19:00:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5567B",
		"train_name": "(CL) Cikarang (5567B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:02:45",
				"dep_actual": "19:02:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:04:00",
				"dep_actual": "19:05:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:06:00",
				"dep_actual": "19:06:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6065",
		"train_name": "(CL) Cikarang (6065)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:08:45",
				"dep_actual": "19:08:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:10:00",
				"dep_actual": "19:11:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:12:00",
				"dep_actual": "19:12:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6062B",
		"train_name": "(CL) Cikarang (6062B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:09:45",
				"dep_actual": "19:09:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "19:11:00",
				"dep_actual": "19:12:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:13:00",
				"dep_actual": "19:13:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5",
		"train_name": "Argo Semeru (5)",
		"origin": "Surabaya Gubeng",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:11:45",
				"dep_actual": "19:11:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "19:13:00",
				"dep_actual": "19:15:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:16:00",
				"dep_actual": "19:16:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5564A",
		"train_name": "(CL) Cikarang (5564A)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:16:45",
				"dep_actual": "19:16:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "19:18:00",
				"dep_actual": "19:19:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:20:00",
				"dep_actual": "19:20:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5167B",
		"train_name": "(CL) Cikarang (5167B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:17:45",
				"dep_actual": "19:17:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:19:00",
				"dep_actual": "19:20:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:21:00",
				"dep_actual": "19:21:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5152B",
		"train_name": "(CL) Cikarang (5152B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:22:45",
				"dep_actual": "19:22:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "19:24:00",
				"dep_actual": "19:25:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:26:00",
				"dep_actual": "19:26:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5569B",
		"train_name": "(CL) Cikarang (5569B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:22:45",
				"dep_actual": "19:22:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:24:00",
				"dep_actual": "19:25:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:26:00",
				"dep_actual": "19:26:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5154B",
		"train_name": "(CL) Cikarang (5154B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:27:45",
				"dep_actual": "19:27:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "19:29:00",
				"dep_actual": "19:30:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:31:00",
				"dep_actual": "19:31:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "115B",
		"train_name": "Sawunggalih (115B)",
		"origin": "Kutoarjo",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:28:45",
				"dep_actual": "19:28:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "19:30:00",
				"dep_actual": "19:32:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:33:00",
				"dep_actual": "19:33:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5169C",
		"train_name": "(CL) Cikarang (5169C)",
		"origin": "Tambun",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:29:45",
				"dep_actual": "19:29:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:31:00",
				"dep_actual": "19:32:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:33:00",
				"dep_actual": "19:33:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5156B",
		"train_name": "(CL) Cikarang (5156B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:34:45",
				"dep_actual": "19:34:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "19:36:00",
				"dep_actual": "19:37:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:38:00",
				"dep_actual": "19:38:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6067A",
		"train_name": "(CL) Cikarang (6067A)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:35:45",
				"dep_actual": "19:35:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:37:00",
				"dep_actual": "19:38:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:39:00",
				"dep_actual": "19:39:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5171C",
		"train_name": "(CL) Cikarang (5171C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:36:45",
				"dep_actual": "19:36:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:38:00",
				"dep_actual": "19:39:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:40:00",
				"dep_actual": "19:40:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5566A",
		"train_name": "(CL) Cikarang (5566A)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:44:45",
				"dep_actual": "19:44:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "19:46:00",
				"dep_actual": "19:47:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:48:00",
				"dep_actual": "19:48:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5173C",
		"train_name": "(CL) Cikarang (5173C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:45:45",
				"dep_actual": "19:45:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:47:00",
				"dep_actual": "19:48:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:49:00",
				"dep_actual": "19:49:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5158B",
		"train_name": "(CL) Cikarang (5158B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:50:45",
				"dep_actual": "19:50:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "19:52:00",
				"dep_actual": "19:53:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "19:54:00",
				"dep_actual": "19:54:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5573B",
		"train_name": "(CL) Cikarang (5573B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:52:45",
				"dep_actual": "19:52:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:54:00",
				"dep_actual": "19:55:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:56:00",
				"dep_actual": "19:56:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6069",
		"train_name": "(CL) Cikarang (6069)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:55:45",
				"dep_actual": "19:55:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "19:57:00",
				"dep_actual": "19:58:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "19:59:00",
				"dep_actual": "19:59:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "28",
		"train_name": "Argo Merbabu (28)",
		"origin": "Gambir",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "19:57:45",
				"dep_actual": "19:57:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "19:59:00",
				"dep_actual": "20:01:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:02:00",
				"dep_actual": "20:02:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "49",
		"train_name": "Purwojaya (49)",
		"origin": "Kroya",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "19:59:45",
				"dep_actual": "19:59:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "20:01:00",
				"dep_actual": "20:03:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:04:00",
				"dep_actual": "20:04:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5160B",
		"train_name": "(CL) Cikarang (5160B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:03:45",
				"dep_actual": "20:03:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "20:05:00",
				"dep_actual": "20:06:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:07:00",
				"dep_actual": "20:07:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5575C",
		"train_name": "(CL) Cikarang (5575C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:07:45",
				"dep_actual": "20:07:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:09:00",
				"dep_actual": "20:10:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:11:00",
				"dep_actual": "20:11:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5568A 💐",
		"train_name": "(CL) Cikarang (5568A 💐)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:12:45",
				"dep_actual": "20:12:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "20:14:00",
				"dep_actual": "20:15:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:16:00",
				"dep_actual": "20:16:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5175B",
		"train_name": "(CL) Cikarang (5175B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:13:45",
				"dep_actual": "20:13:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:15:00",
				"dep_actual": "20:16:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:17:00",
				"dep_actual": "20:17:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6066B",
		"train_name": "(CL) Cikarang (6066B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:18:45",
				"dep_actual": "20:18:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "20:20:00",
				"dep_actual": "20:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:22:00",
				"dep_actual": "20:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5177A",
		"train_name": "(CL) Cikarang (5177A)",
		"origin": "Cikarang",
		"destination": "Manggarai",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:21:45",
				"dep_actual": "20:21:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:23:00",
				"dep_actual": "20:24:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:25:00",
				"dep_actual": "20:25:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6071A",
		"train_name": "(CL) Cikarang (6071A)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:24:45",
				"dep_actual": "20:24:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:26:00",
				"dep_actual": "20:27:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:28:00",
				"dep_actual": "20:28:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5570",
		"train_name": "(CL) Cikarang (5570)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:30:45",
				"dep_actual": "20:30:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "20:32:00",
				"dep_actual": "20:33:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:34:00",
				"dep_actual": "20:34:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5577B",
		"train_name": "(CL) Cikarang (5577B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:30:45",
				"dep_actual": "20:30:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:32:00",
				"dep_actual": "20:33:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:34:00",
				"dep_actual": "20:34:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "257B",
		"train_name": "Progo (257B)",
		"origin": "Lempuyangan",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:32:45",
				"dep_actual": "20:32:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "20:34:00",
				"dep_actual": "20:36:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:37:00",
				"dep_actual": "20:37:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6073",
		"train_name": "(CL) Cikarang (6073)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:35:45",
				"dep_actual": "20:35:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:37:00",
				"dep_actual": "20:38:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:39:00",
				"dep_actual": "20:39:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5166B",
		"train_name": "(CL) Cikarang (5166B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:36:45",
				"dep_actual": "20:36:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "20:38:00",
				"dep_actual": "20:39:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:40:00",
				"dep_actual": "20:40:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5572",
		"train_name": "(CL) Cikarang (5572)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:44:45",
				"dep_actual": "20:44:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "20:46:00",
				"dep_actual": "20:47:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:48:00",
				"dep_actual": "20:48:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5179B",
		"train_name": "(CL) Cikarang (5179B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:45:45",
				"dep_actual": "20:45:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "20:47:00",
				"dep_actual": "20:48:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:49:00",
				"dep_actual": "20:49:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5168C",
		"train_name": "(CL) Cikarang (5168C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:50:45",
				"dep_actual": "20:50:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "20:52:00",
				"dep_actual": "20:53:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "20:54:00",
				"dep_actual": "20:54:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "29B",
		"train_name": "Argo Anjasmoro (29B)",
		"origin": "Surabaya Pasarturi",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:52:45",
				"dep_actual": "20:52:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "20:54:00",
				"dep_actual": "20:56:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "20:57:00",
				"dep_actual": "20:57:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5574",
		"train_name": "(CL) Cikarang (5574)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "20:58:45",
				"dep_actual": "20:58:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "21:00:00",
				"dep_actual": "21:01:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:02:00",
				"dep_actual": "21:02:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5181B",
		"train_name": "(CL) Cikarang (5181B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "20:59:45",
				"dep_actual": "20:59:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:01:00",
				"dep_actual": "21:02:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:03:00",
				"dep_actual": "21:03:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6070B",
		"train_name": "(CL) Cikarang (6070B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:02:45",
				"dep_actual": "21:02:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "21:04:00",
				"dep_actual": "21:05:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:06:00",
				"dep_actual": "21:06:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5579B",
		"train_name": "(CL) Cikarang (5579B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:07:45",
				"dep_actual": "21:07:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:09:00",
				"dep_actual": "21:10:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:11:00",
				"dep_actual": "21:11:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5576",
		"train_name": "(CL) Cikarang (5576)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:11:45",
				"dep_actual": "21:11:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "21:13:00",
				"dep_actual": "21:14:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:15:00",
				"dep_actual": "21:15:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "6075",
		"train_name": "(CL) Cikarang (6075)",
		"origin": "Cikarang",
		"destination": "Jakarta Kota",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:11:45",
				"dep_actual": "21:11:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:13:00",
				"dep_actual": "21:14:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:15:00",
				"dep_actual": "21:15:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5170B",
		"train_name": "(CL) Cikarang (5170B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:18:45",
				"dep_actual": "21:18:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "21:20:00",
				"dep_actual": "21:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:22:00",
				"dep_actual": "21:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5174B",
		"train_name": "(CL) Cikarang (5174B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:25:45",
				"dep_actual": "21:25:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "21:27:00",
				"dep_actual": "21:28:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:29:00",
				"dep_actual": "21:29:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6077",
		"train_name": "(CL) Cikarang (6077)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:27:45",
				"dep_actual": "21:27:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:29:00",
				"dep_actual": "21:30:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:31:00",
				"dep_actual": "21:31:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5578A",
		"train_name": "(CL) Cikarang (5578A)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:33:45",
				"dep_actual": "21:33:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "21:35:00",
				"dep_actual": "21:36:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:37:00",
				"dep_actual": "21:37:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5581C",
		"train_name": "(CL) Cikarang (5581C)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:33:45",
				"dep_actual": "21:33:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:35:00",
				"dep_actual": "21:36:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:37:00",
				"dep_actual": "21:37:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5185C",
		"train_name": "(CL) Cikarang (5185C)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:39:45",
				"dep_actual": "21:39:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:41:00",
				"dep_actual": "21:42:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:43:00",
				"dep_actual": "21:43:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6074B",
		"train_name": "(CL) Cikarang (6074B)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:39:45",
				"dep_actual": "21:39:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "21:41:00",
				"dep_actual": "21:42:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:43:00",
				"dep_actual": "21:43:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "PLB 7049",
		"train_name": "Pandalungan (PLB 7049)",
		"origin": "Surabaya Pasarturi",
		"destination": "Gambir",
		"trainType": "intercity",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:45:45",
				"dep_actual": "21:45:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "21:47:00",
				"dep_actual": "21:49:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:50:00",
				"dep_actual": "21:50:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "76B",
		"train_name": "Mataram (76B)",
		"origin": "Pasar Senen",
		"destination": "Solo Balapan",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:47:45",
				"dep_actual": "21:47:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "21:49:00",
				"dep_actual": "21:51:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:52:00",
				"dep_actual": "21:52:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5187B",
		"train_name": "(CL) Cikarang (5187B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:48:45",
				"dep_actual": "21:48:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "21:50:00",
				"dep_actual": "21:51:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:52:00",
				"dep_actual": "21:52:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "21A",
		"train_name": "Argo Muria (21A)",
		"origin": "Semarang Tawang",
		"destination": "Gambir",
		"trainType": "intercity",
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:53:45",
				"dep_actual": "21:53:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "21:55:00",
				"dep_actual": "21:57:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "21:58:00",
				"dep_actual": "21:58:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5176B",
		"train_name": "(CL) Cikarang (5176B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "21:54:45",
				"dep_actual": "21:54:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "21:56:00",
				"dep_actual": "21:57:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "21:58:00",
				"dep_actual": "21:58:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5583B",
		"train_name": "(CL) Cikarang (5583B)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "21:59:45",
				"dep_actual": "21:59:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:01:00",
				"dep_actual": "22:02:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:03:00",
				"dep_actual": "22:03:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6079",
		"train_name": "(CL) Cikarang (6079)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:02:45",
				"dep_actual": "22:02:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:04:00",
				"dep_actual": "22:05:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:06:00",
				"dep_actual": "22:06:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "139B",
		"train_name": "Parahyangan (139B)",
		"origin": "Bandung",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:06:45",
				"dep_actual": "22:06:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "22:08:00",
				"dep_actual": "22:10:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:11:00",
				"dep_actual": "22:11:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5580",
		"train_name": "(CL) Cikarang (5580)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:08:45",
				"dep_actual": "22:08:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "22:10:00",
				"dep_actual": "22:11:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:12:00",
				"dep_actual": "22:12:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5189B",
		"train_name": "(CL) Cikarang (5189B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:11:45",
				"dep_actual": "22:11:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:13:00",
				"dep_actual": "22:14:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:15:00",
				"dep_actual": "22:15:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5180B",
		"train_name": "(CL) Cikarang (5180B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:13:45",
				"dep_actual": "22:13:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "22:15:00",
				"dep_actual": "22:16:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:17:00",
				"dep_actual": "22:17:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "D1/11214",
		"train_name": "KLB Angkutan Balast (D1/11214)",
		"origin": "Kampung Bandan",
		"destination": "Klari",
		"trainType": "freight",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:16:45",
				"dep_actual": "22:16:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "22:18:00",
				"dep_actual": "22:30:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:31:00",
				"dep_actual": "22:31:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5191B",
		"train_name": "(CL) Cikarang (5191B)",
		"origin": "Cikarang",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:18:45",
				"dep_actual": "22:18:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:20:00",
				"dep_actual": "22:21:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:22:00",
				"dep_actual": "22:22:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "92",
		"train_name": "Jayabaya (92)",
		"origin": "Pasar Senen",
		"destination": "Surabaya Pasarturi",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:23:45",
				"dep_actual": "22:23:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "22:25:00",
				"dep_actual": "22:27:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:28:00",
				"dep_actual": "22:28:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5182B",
		"train_name": "(CL) Cikarang (5182B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:24:45",
				"dep_actual": "22:24:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "22:26:00",
				"dep_actual": "22:27:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:28:00",
				"dep_actual": "22:28:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5193B",
		"train_name": "(CL) Cikarang (5193B)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:24:45",
				"dep_actual": "22:24:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:26:00",
				"dep_actual": "22:27:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:28:00",
				"dep_actual": "22:28:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6078B",
		"train_name": "(CL) Cikarang (6078B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:31:45",
				"dep_actual": "22:31:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "22:33:00",
				"dep_actual": "22:34:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:35:00",
				"dep_actual": "22:35:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "6081",
		"train_name": "(CL) Cikarang (6081)",
		"origin": "Bekasi",
		"destination": "Kampung Bandan",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:31:45",
				"dep_actual": "22:31:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:33:00",
				"dep_actual": "22:34:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:35:00",
				"dep_actual": "22:35:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5582",
		"train_name": "(CL) Cikarang (5582)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:38:45",
				"dep_actual": "22:38:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "22:40:00",
				"dep_actual": "22:41:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:42:00",
				"dep_actual": "22:42:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5195",
		"train_name": "(CL) Cikarang (5195)",
		"origin": "Cikarang",
		"destination": "Manggarai",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:44:45",
				"dep_actual": "22:44:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "22:46:00",
				"dep_actual": "22:47:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "22:48:00",
				"dep_actual": "22:48:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5186C",
		"train_name": "(CL) Cikarang (5186C)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:53:45",
				"dep_actual": "22:53:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "22:55:00",
				"dep_actual": "22:56:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:57:00",
				"dep_actual": "22:57:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "22",
		"train_name": "Argo Muria (22)",
		"origin": "Gambir",
		"destination": "Semarang Tawang",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "22:53:45",
				"dep_actual": "22:53:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "22:55:00",
				"dep_actual": "22:57:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "22:58:00",
				"dep_actual": "22:58:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "269B",
		"train_name": "Matarmaja (269B)",
		"origin": "Malang",
		"destination": "Pasar Senen",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "22:55:45",
				"dep_actual": "22:55:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "22:57:00",
				"dep_actual": "22:59:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:00:00",
				"dep_actual": "23:00:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "5584",
		"train_name": "(CL) Cikarang (5584)",
		"origin": "Kampung Bandan",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:04:45",
				"dep_actual": "23:04:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "23:06:00",
				"dep_actual": "23:07:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:08:00",
				"dep_actual": "23:08:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "125F",
		"train_name": "Cheribon Fakultatif (125F)",
		"origin": "Cirebon",
		"destination": "Gambir",
		"trainType": null,
		"neighborBefore": "Bekasi",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:04:45",
				"dep_actual": "23:04:45",
				"line": "t4",
				"entryLine": "t4"
			},
			{
				"station": "JNG",
				"arr_actual": "23:06:00",
				"dep_actual": "23:08:00",
				"line": "t4"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:09:00",
				"dep_actual": "23:09:00",
				"line": "t4"
			}
		]
	},
	{
		"train_no": "6083",
		"train_name": "(CL) Cikarang (6083)",
		"origin": "Bekasi",
		"destination": "Jakarta Kota",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Pondok Jati",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:05:45",
				"dep_actual": "23:05:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "23:07:00",
				"dep_actual": "23:08:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:09:00",
				"dep_actual": "23:09:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5197C",
		"train_name": "(CL) Cikarang (5197C)",
		"origin": "Cikarang",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:10:45",
				"dep_actual": "23:10:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "23:12:00",
				"dep_actual": "23:13:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:14:00",
				"dep_actual": "23:14:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6080B",
		"train_name": "(CL) Cikarang (6080B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:12:45",
				"dep_actual": "23:12:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "23:14:00",
				"dep_actual": "23:15:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:16:00",
				"dep_actual": "23:16:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5199B",
		"train_name": "(CL) Cikarang (5199B)",
		"origin": "Bekasi",
		"destination": "Angke",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:17:45",
				"dep_actual": "23:17:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "23:19:00",
				"dep_actual": "23:20:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:21:00",
				"dep_actual": "23:21:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "140B",
		"train_name": "Parahyangan (140B)",
		"origin": "Gambir",
		"destination": "Bandung",
		"trainType": null,
		"neighborBefore": "Matraman",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:17:45",
				"dep_actual": "23:17:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "23:19:00",
				"dep_actual": "23:21:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:22:00",
				"dep_actual": "23:22:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5201",
		"train_name": "(CL) Cikarang (5201)",
		"origin": "Cikarang",
		"destination": "Manggarai",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:23:45",
				"dep_actual": "23:23:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "23:25:00",
				"dep_actual": "23:26:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:27:00",
				"dep_actual": "23:27:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "5190B",
		"train_name": "(CL) Cikarang (5190B)",
		"origin": "Angke",
		"destination": "Bekasi",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:26:45",
				"dep_actual": "23:26:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "23:28:00",
				"dep_actual": "23:29:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:30:00",
				"dep_actual": "23:30:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "258B",
		"train_name": "Progo (258B)",
		"origin": "Pasar Senen",
		"destination": "Lempuyangan",
		"trainType": null,
		"neighborBefore": "Pondok Jati",
		"neighborAfter": "Bekasi",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:28:45",
				"dep_actual": "23:28:45",
				"line": "t6",
				"entryLine": "t6"
			},
			{
				"station": "JNG",
				"arr_actual": "23:30:00",
				"dep_actual": "23:32:00",
				"line": "t6"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:33:00",
				"dep_actual": "23:33:00",
				"line": "t6"
			}
		]
	},
	{
		"train_no": "5203",
		"train_name": "(CL) Cikarang (5203)",
		"origin": "Cikarang",
		"destination": "Manggarai",
		"trainType": "krl",
		"neighborBefore": "Klender",
		"neighborAfter": "Matraman",
		"stops": [
			{
				"station": "JNG-E",
				"arr_actual": "23:31:45",
				"dep_actual": "23:31:45",
				"line": "t2",
				"entryLine": "t2"
			},
			{
				"station": "JNG",
				"arr_actual": "23:33:00",
				"dep_actual": "23:34:00",
				"line": "t2"
			},
			{
				"station": "JNG-W",
				"arr_actual": "23:35:00",
				"dep_actual": "23:35:00",
				"line": "t2"
			}
		]
	},
	{
		"train_no": "6082B",
		"train_name": "(CL) Cikarang (6082B)",
		"origin": "Kampung Bandan",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:33:45",
				"dep_actual": "23:33:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "23:35:00",
				"dep_actual": "23:36:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:37:00",
				"dep_actual": "23:37:00",
				"line": "t1"
			}
		]
	},
	{
		"train_no": "5192B",
		"train_name": "(CL) Cikarang (5192B)",
		"origin": "Angke",
		"destination": "Cikarang",
		"trainType": "krl",
		"neighborBefore": "Matraman",
		"neighborAfter": "Klender",
		"stops": [
			{
				"station": "JNG-W",
				"arr_actual": "23:52:45",
				"dep_actual": "23:52:45",
				"line": "t1",
				"entryLine": "t1"
			},
			{
				"station": "JNG",
				"arr_actual": "23:54:00",
				"dep_actual": "23:55:00",
				"line": "t1"
			},
			{
				"station": "JNG-E",
				"arr_actual": "23:56:00",
				"dep_actual": "23:56:00",
				"line": "t1"
			}
		]
	}
];
