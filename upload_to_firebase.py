import openpyxl
import json
import urllib.request
import ssl
import sys

def parse_and_upload():
    print("1. Đang đọc dữ liệu từ file sheet_data.xlsx...")
    wb = openpyxl.load_workbook('/Users/linhvu/.gemini/antigravity-ide/scratch/sheet_data.xlsx', data_only=True)

    # 1. Packages 'GÓI THAY LLN'
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

    print(f"-> Đã nạp {len(packages_list)} gói thay lõi lọc.")

    # 2. Chi tiết lõi & chu kỳ từ 'Thời gian thay lõi lọc'
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
    print(f"-> Đã nạp chi tiết lõi lọc cho {len(schedule_map)} loại gói.")

    # 3. Products 'MÁY LỌC NƯỚC-GÓI THAY LLN'
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

    print(f"-> Đã nạp {len(products_list)} máy lọc nước.")

    # Lưu bản copy JSON local cho Web App sử dụng trực tiếp và fallback
    out_dir = '/Users/linhvu/.gemini/antigravity-ide/scratch/tra-cuu-loi-loc'
    local_data = {
        'lastUpdated': '2026-10-08T18:20:00Z',
        'sheetId': '1oDMEUk0xnP0nXHGxNJa8uLmcSOHsauaccEpp6EFcD7I',
        'products': products_list,
        'packages': packages_list,
        'schedule': schedule_map
    }
    with open(f'{out_dir}/data.json', 'w', encoding='utf-8') as f:
        json.dump(local_data, f, ensure_ascii=False, indent=2)
    print(f"-> Đã lưu bản local data.json tại {out_dir}/data.json")

    # 4. Upload lên Firebase Cloud Firestore
    print("2. Đang đồng bộ và lưu dữ liệu lên Firebase Cloud Firestore (crm-43751-71e4b)...")
    api_key = 'AIzaSyA_FevBrpgE6R1YVbL321BeuX5J8v0Su00'
    base_url = 'https://firestore.googleapis.com/v1/projects/crm-43751-71e4b/databases/(default)/documents/tra_cuu_loi_loc'
    ctx = ssl._create_unverified_context()

    # Upload Doc 1: sheet_may_loc_nuoc
    doc1 = {
        'fields': {
            'sheetTitle': {'stringValue': 'MÁY LỌC NƯỚC-GÓI THAY LLN'},
            'totalItems': {'integerValue': str(len(products_list))},
            'itemsJson': {'stringValue': json.dumps(products_list, ensure_ascii=False)},
            'updatedAt': {'stringValue': '2026-10-08T18:20:00Z'}
        }
    }
    req1 = urllib.request.Request(
        f'{base_url}/sheet_may_loc_nuoc?key={api_key}',
        data=json.dumps(doc1).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req1, context=ctx) as r:
        print("✅ Đã lưu Sheet 'MÁY LỌC NƯỚC-GÓI THAY LLN' lên Firebase! (Status:", r.status, ")")

    # Upload Doc 2: sheet_goi_thay_lln
    doc2 = {
        'fields': {
            'sheetTitle': {'stringValue': 'GÓI THAY LLN'},
            'totalItems': {'integerValue': str(len(packages_list))},
            'itemsJson': {'stringValue': json.dumps(packages_list, ensure_ascii=False)},
            'updatedAt': {'stringValue': '2026-10-08T18:20:00Z'}
        }
    }
    req2 = urllib.request.Request(
        f'{base_url}/sheet_goi_thay_lln?key={api_key}',
        data=json.dumps(doc2).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req2, context=ctx) as r:
        print("✅ Đã lưu Sheet 'GÓI THAY LLN' lên Firebase! (Status:", r.status, ")")

    # Upload Doc 3: sheet_thoi_gian_thay_loi (Bonus chi tiết linh kiện)
    doc3 = {
        'fields': {
            'sheetTitle': {'stringValue': 'Thời gian thay lõi lọc'},
            'scheduleJson': {'stringValue': json.dumps(schedule_map, ensure_ascii=False)},
            'updatedAt': {'stringValue': '2026-10-08T18:20:00Z'}
        }
    }
    req3 = urllib.request.Request(
        f'{base_url}/sheet_thoi_gian_thay_loi?key={api_key}',
        data=json.dumps(doc3).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req3, context=ctx) as r:
        print("✅ Đã lưu Sheet 'Thời gian thay lõi lọc' lên Firebase! (Status:", r.status, ")")

    # Upload Doc 4: metadata
    doc4 = {
        'fields': {
            'systemName': {'stringValue': 'Tra Cứu Giá Gói Thay Lõi Lọc Nước'},
            'sourceSheetUrl': {'stringValue': 'https://docs.google.com/spreadsheets/d/1oDMEUk0xnP0nXHGxNJa8uLmcSOHsauaccEpp6EFcD7I/edit?usp=sharing'},
            'totalProducts': {'integerValue': str(len(products_list))},
            'totalPackages': {'integerValue': str(len(packages_list))},
            'updatedAt': {'stringValue': '2026-10-08T18:20:00Z'}
        }
    }
    req4 = urllib.request.Request(
        f'{base_url}/metadata?key={api_key}',
        data=json.dumps(doc4).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req4, context=ctx) as r:
        print("✅ Đã lưu Metadata hệ thống lên Firebase! (Status:", r.status, ")")

    print("\n🎉 HOÀN THÀNH TẤT CẢ: Dữ liệu 2 sheet đã được đồng bộ và lưu trữ hoàn chỉnh trên Firebase Firestore!")

if __name__ == '__main__':
    parse_and_upload()
