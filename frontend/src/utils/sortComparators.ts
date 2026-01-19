// utils/sortComparators.ts

export type SortComparator = (a: any, b: any) => number;

export function getSortComparator(
  propertyType: string,
  config?: any
): SortComparator {
  switch (propertyType) {
    case 'number':
      return numberSort;
    case 'date':
      return dateSort;
    case 'checkbox':
      return checkboxSort;
    // YENİ: PRIORITY TÜRÜ İÇİN ÖZEL MANTIK
    case 'priority': 
        return (a, b) => prioritySort(a, b, config?.options || []);
    case 'select':
    case 'status':
      return (a, b) => selectSort(a, b, config?.options || []);
    case 'multi_select':
      return multiSelectSort;
    case 'text':
    default:
      return textSort;
  }
}

// --- SABİT PUAN TABLOSU ---
// Sistem tarafından oluşturulan seçeneklerin puan karşılıkları
const PRIORITY_SCORES: Record<string, number> = {
    'Çok Yüksek': 5,
    'Yüksek': 4,
    'Orta': 3,
    'Düşük': 2,
    'Çok Düşük': 1
}

// 1. ÖNCELİK (PRIORITY) SIRALAMA
function prioritySort(
    a: any,
    b: any,
    options: Array<{ id: string; name: string }>
): number {
    // Option ID'sinden ismi bul
    const optA = options.find(o => o.id === a?.option_id);
    const optB = options.find(o => o.id === b?.option_id);

    // İsme göre puanı al (Yoksa 0)
    const scoreA = optA ? (PRIORITY_SCORES[optA.name] || 0) : 0;
    const scoreB = optB ? (PRIORITY_SCORES[optB.name] || 0) : 0;

    // Matematiksel sırala (Küçükten Büyüğe: 1 -> 5)
    return scoreA - scoreB;
}

// 2. SAYI SIRALAMA
function numberSort(a: any, b: any): number {
  const aVal = parseFloat(a) || 0;
  const bVal = parseFloat(b) || 0;
  return aVal - bVal;
}

// 3. TARİH SIRALAMA
function dateSort(a: any, b: any): number {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return aTime - bTime;
}

// 4. CHECKBOX SIRALAMA
function checkboxSort(a: any, b: any): number {
  const aChecked = a === true; 
  const bChecked = b === true;
  return (aChecked === bChecked) ? 0 : aChecked ? 1 : -1;
}

// 5. SELECT ve STATUS SIRALAMA
const STATUS_RANK: Record<string, number> = {
  'To-do': 1,
  'In Progress': 2,
  'Complete': 3
};

function selectSort(
  a: any,
  b: any,
  options: Array<{ id: string; name: string; group?: string }>
): number {
  const optA = options.find(o => o.id === a?.option_id);
  const optB = options.find(o => o.id === b?.option_id);

  if (!optA && !optB) return 0;
  if (!optA) return -1;
  if (!optB) return 1;

  if (optA.group && optB.group) {
    const rankA = STATUS_RANK[optA.group] || 99;
    const rankB = STATUS_RANK[optB.group] || 99;
    if (rankA !== rankB) return rankA - rankB;
  }

  const indexA = options.findIndex(o => o.id === optA.id);
  const indexB = options.findIndex(o => o.id === optB.id);
  return indexA - indexB;
}

// 6. MULTI-SELECT SIRALAMA
function multiSelectSort(a: any, b: any): number {
  const aFirst = a?.option_ids?.[0] || '';
  const bFirst = b?.option_ids?.[0] || '';
  return textSort(aFirst, bFirst);
}

// 7. METİN SIRALAMA
function textSort(a: any, b: any): number {
  const aStr = String(a || '').toLowerCase();
  const bStr = String(b || '').toLowerCase();
  return aStr.localeCompare(bStr, 'tr-TR');
}

// BOŞ DEĞER YÖNETİMİ
export function withNullHandling(
  comparator: SortComparator
): SortComparator {
  return (a, b) => {
    const isEmpty = (val: any) => {
        if (val === null || val === undefined) return true;
        if (typeof val === 'string' && val.trim() === '') return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === 'object' && !val.option_id && !val.option_ids && !val.date && !val.checked && !val.text) return true;
        return false;
    };

    const aEmpty = isEmpty(a);
    const bEmpty = isEmpty(b);
    
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return -1;
    if (bEmpty) return 1;
    
    return comparator(a, b);
  };
}