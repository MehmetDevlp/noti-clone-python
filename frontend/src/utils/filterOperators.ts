export interface FilterOperator {
  value: string;
  label: string;
  types: string[]; // Hangi veri tiplerinde görünecek
  requiresValue: boolean; // Kullanıcıdan değer girmesini isteyecek mi? (Örn: "Boş" demek için değer gerekmez)
}

export const FILTER_OPERATORS: FilterOperator[] = [
  // --- METİN OPERATÖRLERİ ---
  { value: 'contains', label: 'İçerir', types: ['text', 'title'], requiresValue: true },
  { value: 'does_not_contain', label: 'İçermez', types: ['text', 'title'], requiresValue: true },
  { value: 'is', label: 'Tam Eşleşir', types: ['text', 'title', 'select', 'status', 'priority'], requiresValue: true },
  { value: 'is_not', label: 'Eşit Değildir', types: ['text', 'title', 'select', 'status', 'priority'], requiresValue: true },
  { value: 'starts_with', label: 'Şununla Başlar', types: ['text', 'title'], requiresValue: true },
  { value: 'ends_with', label: 'Şununla Biter', types: ['text', 'title'], requiresValue: true },
  { value: 'is_empty', label: 'Boş', types: ['text', 'title', 'select', 'multi_select', 'date', 'number', 'status', 'priority'], requiresValue: false },
  { value: 'is_not_empty', label: 'Dolu', types: ['text', 'title', 'select', 'multi_select', 'date', 'number', 'status', 'priority'], requiresValue: false },
  
  // --- SAYI OPERATÖRLERİ ---
  { value: 'equals', label: '=', types: ['number'], requiresValue: true },
  { value: 'does_not_equal', label: '≠', types: ['number'], requiresValue: true },
  { value: 'greater_than', label: '>', types: ['number'], requiresValue: true },
  { value: 'less_than', label: '<', types: ['number'], requiresValue: true },
  { value: 'greater_than_or_equal', label: '≥', types: ['number'], requiresValue: true },
  { value: 'less_than_or_equal', label: '≤', types: ['number'], requiresValue: true },
  
  // --- TARİH OPERATÖRLERİ ---
  { value: 'date_is', label: 'Tam Tarih', types: ['date'], requiresValue: true },
  { value: 'date_before', label: 'Önce', types: ['date'], requiresValue: true },
  { value: 'date_after', label: 'Sonra', types: ['date'], requiresValue: true },
  { value: 'date_within', label: 'Zaman Aralığı', types: ['date'], requiresValue: true }, // "Bu hafta", "Geçen ay" için
  
  // --- ÇOKLU SEÇİM (TAGS) ---
  { value: 'contains_any', label: 'Herhangi birini içerir', types: ['multi_select'], requiresValue: true },
  { value: 'contains_all', label: 'Hepsini içerir', types: ['multi_select'], requiresValue: true },
  
  // --- CHECKBOX ---
  { value: 'is_checked', label: 'İşaretli', types: ['checkbox'], requiresValue: false },
  { value: 'is_not_checked', label: 'İşaretli Değil', types: ['checkbox'], requiresValue: false },
];

export function getOperatorsForType(type: string): FilterOperator[] {
  // Title tipini Text gibi ele alalım
  const searchType = type === 'title' ? 'text' : type;
  return FILTER_OPERATORS.filter(op => op.types.includes(searchType));
}