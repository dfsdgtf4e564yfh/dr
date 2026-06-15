def gregorian_to_jalali_year(gy, gm, gd):
    gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + 365 * gy + (gy2 + 3) // 4 - (gy2 + 99) // 100 + (gy2 + 399) // 400 + gd + gdm[gm - 1]
    jy = -1595 + 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
    return jy


def jalali_to_gregorian(jy, jm, jd):
    jy1 = jy + 1595
    days = -355668 + 365 * jy1 + (jy1 // 33) * 8 + ((jy1 % 33) + 3) // 4 + jd + ((jm - 1) * 31 if jm < 7 else (jm - 7) * 30 + 186)
    gy = 400 * (days // 146097)
    days %= 146097
    if days > 36524:
        days -= 1
        gy += 100 * (days // 36524)
        days %= 36524
        if days >= 365:
            days += 1
    gy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        gy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 31:
        gm = 1
    elif days < 60:
        gm = 2
    elif days < 91:
        gm = 3
    elif days < 121:
        gm = 4
    elif days < 152:
        gm = 5
    elif days < 182:
        gm = 6
    elif days < 213:
        gm = 7
    elif days < 244:
        gm = 8
    elif days < 274:
        gm = 9
    elif days < 305:
        gm = 10
    elif days < 335:
        gm = 11
    else:
        gm = 12
    month_days = 0
    if gm < 2:
        month_days = 0
    elif gm < 3:
        month_days = 31
    elif gm < 4:
        month_days = 60
    elif gm < 5:
        month_days = 91
    elif gm < 6:
        month_days = 121
    elif gm < 7:
        month_days = 152
    elif gm < 8:
        month_days = 182
    elif gm < 9:
        month_days = 213
    elif gm < 10:
        month_days = 244
    elif gm < 11:
        month_days = 274
    elif gm < 12:
        month_days = 305
    else:
        month_days = 335
    gd = 1 + days - month_days
    from datetime import date
    return date(gy, gm, gd)


def toJalali(date_input):
    from datetime import date as dt_date, datetime
    if isinstance(date_input, str):
        try:
            d = dt_date.fromisoformat(date_input)
        except ValueError:
            try:
                d = datetime.strptime(date_input, '%Y-%m-%d').date()
            except ValueError:
                return date_input
    elif isinstance(date_input, dt_date):
        d = date_input
    else:
        return str(date_input)

    jy = gregorian_to_jalali_year(d.year, d.month, d.day)
    jm_tmp = 0
    jd_tmp = 0
    gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = d.year + 1 if d.month > 2 else d.year
    days = 355666 + 365 * d.year + (gy2 + 3) // 4 - (gy2 + 99) // 100 + (gy2 + 399) // 400 + d.day + gdm[d.month - 1]
    jy2 = -1595 + 33 * (days // 12053)
    days %= 12053
    jy2 += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy2 += (days - 1) // 365
        days = (days - 1) % 365
    else:
        days = days
    if days < 186:
        jm_tmp = 1 + days // 31
        jd_tmp = 1 + days % 31
    else:
        days -= 186
        jm_tmp = 7 + days // 30
        jd_tmp = 1 + days % 30

    return f'{jy2}/{jm_tmp:02d}/{jd_tmp:02d}'
