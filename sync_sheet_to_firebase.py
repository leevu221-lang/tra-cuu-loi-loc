#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tự động đồng bộ dữ liệu từ Google Sheet nguồn lên Firebase Firestore & cập nhật Web App
Google Sheet: https://docs.google.com/spreadsheets/d/1oDMEUk0xnP0nXHGxNJa8uLmcSOHsauaccEpp6EFcD7I/edit?usp=sharing
"""

import urllib.request
import json
import ssl
import sys
import os
import openpyxl
from datetime import datetime

SHEET_ID = "1oDMEUk0xnP0nXHGxNJa8uLmcSOHsauaccEpp6EFcD7I"
FIREBASE_API_KEY = "AIzaSyA_FevBrpgE6R1YVbL321BeuX5J8v0Su00"
FIREBASE_BASE_URL = "https://firestore.googleapis.com/v1/projects/crm-43751-71e4b/databases/(default)/documents/tra_cuu_loi_loc"

WORK_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(WORK_DIR, "sheet_downloaded.xlsx")
DATA_JSON_PATH = os.path.join(WORK_DIR, "data.json")
DATA_JS_PATH = os.path.join(WORK_DIR, "data.js")

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def download_sheet():
    log(f"1. Đang tải tệp Excel mới nhất từ Google Sheet (ID: {SHEET_ID})...")
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as resp:
        content = resp.read()
        with open(XLSX_PATH, "wb") as f:
            f.write(content)
        log(f"-> Đã tải thành công tệp Excel ({len(content):,} bytes).")

def parse_and_process():
    log("2. Đang phân tích dữ liệu 2 sheet: 'MÁY LỌC NƯỚC-GÓI THAY LLN' & 'GÓI THAY LLN'...")
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)

    # 1. Bảng giá các gói thay lõi ('GÓI THAY LLN')
    s_pkg = wb['GÓI THAY LLN']
    packages_map = {}
    packages_list = []
    for r in range(4, s_pkg.max_row + 1):
        name = s_pkg.cell(row=r, column=1).value
        if not name:
            continue
        name_str = str(name).strip()
        y1_c = int(s_pkg.cell(row=r, column=2).value or 0)
        y1_p = int(s_pkg.cell(row=r, column=3).value or 0)
        y2_c = int(s_pkg.cell(row=r, column=4).value or 0)
        y2_p = int(s_pkg.cell(row=r, column=5).value or 0)
        y3_c = int(s_pkg.cell(row=r, column=6).value or 0)
        y3_p = int(s_pkg.cell(row=r, column=7).value or 0)
        y4_c = int(s_pkg.cell(row=r, column=8).value or 0)
        y4_p = int(s_pkg.cell(row=r, column=9).value or 0)

        pkg_obj = {
            'packageName': name_str,
            'year1': {'cores': y1_c, 'price': y1_p},
            'year2': {'cores': y2_c, 'price': y2_p},
            'year3': {'cores': y3_c, 'price': y3_p},
            'year4': {'cores': y4_c, 'price': y4_p}
        }
        norm = ' '.join(name_str.lower().split())
        packages_map[norm] = pkg_obj
        packages_list.append(pkg_obj)
    log(f"-> Đã trích xuất {len(packages_list)} gói thay lõi lọc.")

    # 2. Chi tiết linh kiện lõi ('Thời gian thay lõi lọc')
    schedule_map = {}
    if 'Thời gian thay lõi lọc' in wb.sheetnames:
        s_sch = wb['Thời gian thay lõi lọc']
        for r in range(3, s_sch.max_row + 1):
            pkg_ref = s_sch.cell(row=r, column=1).value
            if not pkg_ref:
                continue
            pkg_ref_str = str(pkg_ref).strip()
            core_code = s_sch.cell(row=r, column=2).value
            core_name = s_sch.cell(row=r, column=3).value
            core_pos = s_sch.cell(row=r, column=4).value
            replace_months = s_sch.cell(row=r, column=5).value
            m1_3 = int(s_sch.cell(row=r, column=6).value or 0)
            m4_6 = int(s_sch.cell(row=r, column=7).value or 0)
            m7_9 = int(s_sch.cell(row=r, column=8).value or 0)
            m10_12 = int(s_sch.cell(row=r, column=9).value or 0)

            norm_ref = ' '.join(pkg_ref_str.lower().split())
            if norm_ref not in schedule_map:
                schedule_map[norm_ref] = []
            
            code_val = str(int(core_code)) if isinstance(core_code, (int, float)) and core_code else str(core_code or '')
            schedule_map[norm_ref].append({
                'code': code_val,
                'name': str(core_name or '').strip(),
                'position': int(core_pos) if isinstance(core_pos, (int, float)) and core_pos else str(core_pos or ''),
                'intervalMonths': int(replace_months) if isinstance(replace_months, (int, float)) and replace_months else str(replace_months or ''),
                'q1': m1_3,
                'q2': m4_6,
                'q3': m7_9,
                'q4': m10_12,
            })
    log(f"-> Đã trích xuất chi tiết cấu tạo lõi lọc cho {len(schedule_map)} loại gói.")

    # 3. Danh sách máy lọc nước ('MÁY LỌC NƯỚC-GÓI THAY LLN')
    s_prod = wb['MÁY LỌC NƯỚC-GÓI THAY LLN']
    products_list = []
    for r in range(2, s_prod.max_row + 1):
        code = s_prod.cell(row=r, column=1).value
        if not code:
            continue
        code_str = str(int(code)) if isinstance(code, (int, float)) else str(code).strip()
        name = str(s_prod.cell(row=r, column=2).value or '').strip()
        raw_price = s_prod.cell(row=r, column=3).value
        price = int(round(raw_price)) if isinstance(raw_price, (int, float)) and raw_price else 0
        raw_warranty = s_prod.cell(row=r, column=4).value
        warranty = int(raw_warranty) if isinstance(raw_warranty, (int, float)) and raw_warranty else 0
        category = str(s_prod.cell(row=r, column=5).value or '').strip()
        brand = str(s_prod.cell(row=r, column=6).value or '').strip()
        price_range = str(s_prod.cell(row=r, column=7).value or '').strip()
        pkg_name = str(s_prod.cell(row=r, column=8).value or '').strip()

        norm_pkg = ' '.join(pkg_name.lower().split())
        matched_pkg = packages_map.get(norm_pkg, None)
        matched_schedule = schedule_map.get(norm_pkg, [])

        products_list.append({
            'code': code_str,
            'name': name,
            'price': price,
            'warrantyMonths': warranty,
            'category': category,
            'brand': brand,
            'priceRange': price_range,
            'packageName': pkg_name if pkg_name else 'Chưa thiết kế gói thay lõi',
            'hasPackage': matched_pkg is not None,
            'packagePricing': matched_pkg,
            'coreSchedule': matched_schedule
        })
    log(f"-> Đã trích xuất {len(products_list)} máy lọc nước.")

    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    dataset = {
        'lastUpdated': now_iso,
        'sheetId': SHEET_ID,
        'products': products_list,
        'packages': packages_list,
        'schedule': schedule_map
    }

    # Cập nhật tệp local cho Web App
    with open(DATA_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write("window.EMBEDDED_DATA = " + json.dumps(dataset, ensure_ascii=False) + ";\n")
    log("-> Đã cập nhật thành công data.json & data.js cho Web App.")

    # 4. Upload lên Firebase Firestore
    log("3. Đang lưu trữ và đồng bộ hóa lên Firebase Cloud Firestore (crm-43751-71e4b)...")
    ctx = ssl._create_unverified_context()

    # Upload Doc 1: sheet_may_loc_nuoc
    doc1 = {
        'fields': {
            'sheetTitle': {'stringValue': 'MÁY LỌC NƯỚC-GÓI THAY LLN'},
            'totalItems': {'integerValue': str(len(products_list))},
            'itemsJson': {'stringValue': json.dumps(products_list, ensure_ascii=False)},
            'updatedAt': {'stringValue': now_iso}
        }
    }
    req1 = urllib.request.Request(
        f'{FIREBASE_BASE_URL}/sheet_may_loc_nuoc?key={FIREBASE_API_KEY}',
        data=json.dumps(doc1).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req1, context=ctx) as r:
        log(f"-> Sheet 'MÁY LỌC NƯỚC-GÓI THAY LLN': OK (HTTP {r.status})")

    # Upload Doc 2: sheet_goi_thay_lln
    doc2 = {
        'fields': {
            'sheetTitle': {'stringValue': 'GÓI THAY LLN'},
            'totalItems': {'integerValue': str(len(packages_list))},
            'itemsJson': {'stringValue': json.dumps(packages_list, ensure_ascii=False)},
            'updatedAt': {'stringValue': now_iso}
        }
    }
    req2 = urllib.request.Request(
        f'{FIREBASE_BASE_URL}/sheet_goi_thay_lln?key={FIREBASE_API_KEY}',
        data=json.dumps(doc2).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req2, context=ctx) as r:
        log(f"-> Sheet 'GÓI THAY LLN': OK (HTTP {r.status})")

    # Upload Doc 3: sheet_thoi_gian_thay_loi
    doc3 = {
        'fields': {
            'sheetTitle': {'stringValue': 'Thời gian thay lõi lọc'},
            'scheduleJson': {'stringValue': json.dumps(schedule_map, ensure_ascii=False)},
            'updatedAt': {'stringValue': now_iso}
        }
    }
    req3 = urllib.request.Request(
        f'{FIREBASE_BASE_URL}/sheet_thoi_gian_thay_loi?key={FIREBASE_API_KEY}',
        data=json.dumps(doc3).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req3, context=ctx) as r:
        log(f"-> Sheet 'Thời gian thay lõi lọc': OK (HTTP {r.status})")

    # Upload Doc 4: metadata
    doc4 = {
        'fields': {
            'systemName': {'stringValue': 'Tra Cứu Giá Gói Thay Lõi Lọc Nước'},
            'sourceSheetUrl': {'stringValue': f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?usp=sharing'},
            'totalProducts': {'integerValue': str(len(products_list))},
            'totalPackages': {'integerValue': str(len(packages_list))},
            'updatedAt': {'stringValue': now_iso}
        }
    }
    req4 = urllib.request.Request(
        f'{FIREBASE_BASE_URL}/metadata?key={FIREBASE_API_KEY}',
        data=json.dumps(doc4).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req4, context=ctx) as r:
        log(f"-> Metadata: OK (HTTP {r.status})")

    log("🎉 ĐỒNG BỘ HOÀN TẤT: Toàn bộ dữ liệu 2 sheet đã được cập nhật thành công lên Firebase!")

def main():
    try:
        download_sheet()
        parse_and_process()
    except Exception as e:
        log(f"❌ Lỗi trong quá trình đồng bộ: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
