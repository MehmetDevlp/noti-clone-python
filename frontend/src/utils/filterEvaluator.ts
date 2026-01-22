import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameDay } from 'date-fns';

export interface FilterRule {
  id: string;
  propertyId: string;
  operator: string;
  value: any;
}

// Bir satırın (item), kurallara uyup uymadığını kontrol eder
export function evaluateFilter(
  itemValue: any,
  filter: FilterRule,
  propertyType: string
): boolean {
  const { operator, value } = filter;

  // 1. BOŞ / DOLU KONTROLÜ (Tüm tipler için ortak)
  if (operator === 'is_empty') {
    return itemValue === null || itemValue === undefined || itemValue === '' || (Array.isArray(itemValue) && itemValue.length === 0);
  }
  if (operator === 'is_not_empty') {
    return itemValue !== null && itemValue !== undefined && itemValue !== '' && (!Array.isArray(itemValue) || itemValue.length > 0);
  }

  // Değer yoksa ve boş kontrolü değilse, ve veri de yoksa eşleşmez
  if (itemValue === null || itemValue === undefined) return false;

  // 2. METİN (TEXT / TITLE)
  if (propertyType === 'text' || propertyType === 'title') {
    const itemStr = String(itemValue.text || itemValue || '').toLowerCase(); // .text obje yapısı veya düz string
    const valueStr = String(value || '').toLowerCase();
    
    switch (operator) {
      case 'contains': return itemStr.includes(valueStr);
      case 'does_not_contain': return !itemStr.includes(valueStr);
      case 'is': return itemStr === valueStr;
      case 'is_not': return itemStr !== valueStr;
      case 'starts_with': return itemStr.startsWith(valueStr);
      case 'ends_with': return itemStr.endsWith(valueStr);
      default: return true;
    }
  }

  // 3. SAYI (NUMBER)
  if (propertyType === 'number') {
    const itemNum = parseFloat(itemValue) || 0;
    const valueNum = parseFloat(value) || 0;
    
    switch (operator) {
      case 'equals': return itemNum === valueNum;
      case 'does_not_equal': return itemNum !== valueNum;
      case 'greater_than': return itemNum > valueNum;
      case 'less_than': return itemNum < valueNum;
      case 'greater_than_or_equal': return itemNum >= valueNum;
      case 'less_than_or_equal': return itemNum <= valueNum;
      default: return true;
    }
  }

  // 4. TARİH (DATE)
  if (propertyType === 'date') {
    // Veritabanından gelen tarih (itemValue.date veya itemValue)
    const rawDate = itemValue?.date || itemValue;
    if (!rawDate) return false;
    
    const itemDate = new Date(rawDate);
    
    if (operator === 'date_within') {
      return evaluateDatePreset(itemDate, value);
    }
    
    // Kullanıcının seçtiği tarih
    const valueDate = new Date(value);
    
    switch (operator) {
      case 'date_is': return isSameDay(itemDate, valueDate);
      case 'date_before': return itemDate < valueDate;
      case 'date_after': return itemDate > valueDate;
      default: return true;
    }
  }

  // 5. SEÇİM (SELECT / STATUS / PRIORITY)
  if (propertyType === 'select' || propertyType === 'status' || propertyType === 'priority') {
    const itemOptionId = itemValue?.option_id; // Obje içinden ID al
    const valueOptionId = value; // Filtreden gelen ID
    
    switch (operator) {
      case 'is': return itemOptionId === valueOptionId;
      case 'is_not': return itemOptionId !== valueOptionId;
      default: return true;
    }
  }

  // 6. ÇOKLU SEÇİM (MULTI-SELECT)
  if (propertyType === 'multi_select') {
    const itemOptionIds = itemValue?.option_ids || [];
    const valueOptionId = value; // Tekil seçim yapıyoruz şimdilik
    
    switch (operator) {
      case 'contains_any': return itemOptionIds.includes(valueOptionId);
      case 'does_not_contain': return !itemOptionIds.includes(valueOptionId);
      default: return true;
    }
  }

  // 7. CHECKBOX
  if (propertyType === 'checkbox') {
    const isChecked = !!itemValue?.checked; // Obje { checked: true } olabilir
    if (operator === 'is_checked') return isChecked === true;
    if (operator === 'is_not_checked') return isChecked === false;
  }

  return true;
}

// Yardımcı: Tarih Aralıkları
function evaluateDatePreset(date: Date, preset: string): boolean {
  const now = new Date();
  
  switch (preset) {
    case 'today': return isSameDay(date, now);
    case 'yesterday': 
      const yest = new Date(now); yest.setDate(now.getDate() - 1);
      return isSameDay(date, yest);
    case 'tomorrow':
      const tom = new Date(now); tom.setDate(now.getDate() + 1);
      return isSameDay(date, tom);
    case 'this_week':
      return isWithinInterval(date, { start: startOfWeek(now, {weekStartsOn: 1}), end: endOfWeek(now, {weekStartsOn: 1}) });
    case 'last_week':
      const lastWeekStart = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), {weekStartsOn: 1});
      const lastWeekEnd = endOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), {weekStartsOn: 1});
      return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
    case 'this_month':
      return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
    case 'last_month':
      const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
      const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    default: return false;
  }
}