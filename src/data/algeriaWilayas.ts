/**
 * 69 Wilayas d'Algérie (Organisation territoriale officielle complète)
 * Inclut l'ensemble des 69 wilayas avec codes, noms et communes principales.
 */

export interface WilayaMeta {
  code: number;
  codeStr: string;
  name: string;
  nameAr: string;
  communes: string[];
}

export const ALGERIA_69_WILAYAS: WilayaMeta[] = [
  { code: 1, codeStr: '01', name: 'Adrar', nameAr: 'أدرار', communes: ['Adrar', 'Reggane', 'Fenoughil', 'Zaouiet Kounta'] },
  { code: 2, codeStr: '02', name: 'Chlef', nameAr: 'الشلف', communes: ['Chlef', 'Ténès', 'Ouled Farès', 'Boukadir'] },
  { code: 3, codeStr: '03', name: 'Laghouat', nameAr: 'الأغواط', communes: ['Laghouat', 'Aflou', 'Ksar El Hirane'] },
  { code: 4, codeStr: '04', name: 'Oum El Bouaghi', nameAr: 'أم البواقي', communes: ['Oum El Bouaghi', 'Aïn Beïda', 'Aïn M\'lila'] },
  { code: 5, codeStr: '05', name: 'Batna', nameAr: 'باتنة', communes: ['Batna', 'Barika', 'Aïn Touta', 'Merouana'] },
  { code: 6, codeStr: '06', name: 'Béjaïa', nameAr: 'بجاية', communes: ['Béjaïa', 'Akbou', 'Amizour', 'El Kseur'] },
  { code: 7, codeStr: '07', name: 'Biskra', nameAr: 'بسكرة', communes: ['Biskra', 'Tolga', 'Sidi Okba', 'Ouled Djellal'] },
  { code: 8, codeStr: '08', name: 'Béchar', nameAr: 'بشار', communes: ['Béchar', 'Abadla', 'Kenadsa'] },
  { code: 9, codeStr: '09', name: 'Blida', nameAr: 'البليدة', communes: ['Blida', 'Ouled Yaïch', 'Boufarik', 'Mouzaïa', 'Larbaâ'] },
  { code: 10, codeStr: '10', name: 'Bouira', nameAr: 'البويرة', communes: ['Bouira', 'Lakhdaria', 'Sour El Ghozlane'] },
  { code: 11, codeStr: '11', name: 'Tamanrasset', nameAr: 'تمنراست', communes: ['Tamanrasset', 'Abalessa', 'In Amguel'] },
  { code: 12, codeStr: '12', name: 'Tébessa', nameAr: 'تبسة', communes: ['Tébessa', 'Cheria', 'Bir El Ater', 'El Aouinet'] },
  { code: 13, codeStr: '13', name: 'Tlemcen', nameAr: 'تلمسان', communes: ['Tlemcen', 'Maghnia', 'Mansourah', 'Remchi', 'Ghazaouet'] },
  { code: 14, codeStr: '14', name: 'Tiaret', nameAr: 'تيارت', communes: ['Tiaret', 'Sougueur', 'Frenda', 'Ksar Chellala'] },
  { code: 15, codeStr: '15', name: 'Tizi Ouzou', nameAr: 'تيزي وزو', communes: ['Tizi Ouzou', 'Azazga', 'Draâ Ben Khedda', 'Tigzirt'] },
  { code: 16, codeStr: '16', name: 'Alger', nameAr: 'الجزائر', communes: ['Kouba', 'Hydra', 'Bab Ezzouar', 'Chéraga', 'Bir Mourad Raïs', 'Dely Ibrahim', 'Rouïba'] },
  { code: 17, codeStr: '17', name: 'Djelfa', nameAr: 'الجلفة', communes: ['Djelfa', 'Aïn Oussara', 'Messaâd', 'Hassi Bahbah'] },
  { code: 18, codeStr: '18', name: 'Jijel', nameAr: 'جيجل', communes: ['Jijel', 'Taher', 'El Milia', 'El Aouana'] },
  { code: 19, codeStr: '19', name: 'Sétif', nameAr: 'سطيف', communes: ['Sétif', 'El Eulma', 'Aïn Oulmene', 'Aïn Arnat', 'Bougaa'] },
  { code: 20, codeStr: '20', name: 'Saïda', nameAr: 'سعيدة', communes: ['Saïda', 'Youb', 'Aïn El Hadjar'] },
  { code: 21, codeStr: '21', name: 'Skikda', nameAr: 'سكيكدة', communes: ['Skikda', 'Collo', 'Azzaba', 'El Harrouch'] },
  { code: 22, codeStr: '22', name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', communes: ['Sidi Bel Abbès', 'Telagh', 'Ben Badis'] },
  { code: 23, codeStr: '23', name: 'Annaba', nameAr: 'عنابة', communes: ['Annaba', 'El Bouni', 'El Hadjar', 'Berrahal'] },
  { code: 24, codeStr: '24', name: 'Guelma', nameAr: 'قالمة', communes: ['Guelma', 'Oued Zenati', 'Bouchegouf'] },
  { code: 25, codeStr: '25', name: 'Constantine', nameAr: 'قسنطينة', communes: ['Constantine', 'El Khroub', 'Nouvelle Ville Ali Mendjeli', 'Hamma Bouziane'] },
  { code: 26, codeStr: '26', name: 'Médéa', nameAr: 'المدية', communes: ['Médéa', 'Berrouaghia', 'Ksar El Boukhari'] },
  { code: 27, codeStr: '27', name: 'Mostaganem', nameAr: 'مستغانم', communes: ['Mostaganem', 'Aïn Tedeles', 'Sidi Ali'] },
  { code: 28, codeStr: '28', name: 'M\'Sila', nameAr: 'المسيلة', communes: ['M\'Sila', 'Boussaâda', 'Sidi Aïssa', 'Magra'] },
  { code: 29, codeStr: '29', name: 'Mascara', nameAr: 'معسكر', communes: ['Mascara', 'Sig', 'Tighennif', 'Mohammadia'] },
  { code: 30, codeStr: '30', name: 'Ouargla', nameAr: 'ورقلة', communes: ['Ouargla', 'Hassi Messaoud', 'Touggourt'] },
  { code: 31, codeStr: '31', name: 'Oran', nameAr: 'وهران', communes: ['Oran', 'Bir El Djir', 'Es Sénia', 'Arzew', 'Aïn El Turk'] },
  { code: 32, codeStr: '32', name: 'El Bayadh', nameAr: 'البيض', communes: ['El Bayadh', 'Rogassa', 'Brezina'] },
  { code: 33, codeStr: '33', name: 'Illizi', nameAr: 'إيليزي', communes: ['Illizi', 'In Amenas', 'Bordj Omar Driss'] },
  { code: 34, codeStr: '34', name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', communes: ['Bordj Bou Arréridj', 'Ras El Oued', 'Mansoura'] },
  { code: 35, codeStr: '35', name: 'Boumerdès', nameAr: 'بومرداس', communes: ['Boumerdès', 'Bordj Menaïel', 'Dellys', 'Khemis El Khechna'] },
  { code: 36, codeStr: '36', name: 'El Tarf', nameAr: 'الطارف', communes: ['El Tarf', 'El Kala', 'Ben M\'Hidi'] },
  { code: 37, codeStr: '37', name: 'Tindouf', nameAr: 'تندوف', communes: ['Tindouf', 'Oum El Assel'] },
  { code: 38, codeStr: '38', name: 'Tissemsilt', nameAr: 'تيسمسيلت', communes: ['Tissemsilt', 'Théniet El Had', 'Lardjem'] },
  { code: 39, codeStr: '39', name: 'El Oued', nameAr: 'الوادي', communes: ['El Oued', 'Guemar', 'Robbah', 'Debila'] },
  { code: 40, codeStr: '40', name: 'Khenchela', nameAr: 'خنشلة', communes: ['Khenchela', 'Kaïs', 'Chechar'] },
  { code: 41, codeStr: '41', name: 'Souk Ahras', nameAr: 'سوق أهراس', communes: ['Souk Ahras', 'Sedrata', 'M\'daourouch'] },
  { code: 42, codeStr: '42', name: 'Tipaza', nameAr: 'تيبازة', communes: ['Tipaza', 'Koléa', 'Cherchell', 'Bou Ismaïl', 'Hadout'] },
  { code: 43, codeStr: '43', name: 'Mila', nameAr: 'ميلة', communes: ['Mila', 'Chelghoum Laïd', 'Tadjenanet', 'Ferdjioua'] },
  { code: 44, codeStr: '44', name: 'Aïn Defla', nameAr: 'عين الدفلى', communes: ['Aïn Defla', 'Khemis Miliana', 'Miliana', 'El Attaf'] },
  { code: 45, codeStr: '45', name: 'Naâma', nameAr: 'النعامة', communes: ['Naâma', 'Mécheria', 'Aïn Sefra'] },
  { code: 46, codeStr: '46', name: 'Aïn Témouchent', nameAr: 'عين تموشنت', communes: ['Aïn Témouchent', 'Béni Saf', 'Hammam Bouhadjar'] },
  { code: 47, codeStr: '47', name: 'Ghardaïa', nameAr: 'غرداية', communes: ['Ghardaïa', 'Metlili', 'El Guerrara', 'Béni Isguen'] },
  { code: 48, codeStr: '48', name: 'Relizane', nameAr: 'غليزان', communes: ['Relizane', 'Oued Rhiou', 'Mazouna'] },
  { code: 49, codeStr: '49', name: 'Timimoun', nameAr: 'تيميمون', communes: ['Timimoun', 'Aougrout', 'Tinerkouk'] },
  { code: 50, codeStr: '50', name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', communes: ['Bordj Badji Mokhtar', 'Timiaouine'] },
  { code: 51, codeStr: '51', name: 'Ouled Djellal', nameAr: 'أولاد جلال', communes: ['Ouled Djellal', 'Sidi Khaled', 'Ras El Miad'] },
  { code: 52, codeStr: '52', name: 'Béni Abbès', nameAr: 'بني عباس', communes: ['Béni Abbès', 'Kerzaz', 'Tabelbala', 'El Ouata'] },
  { code: 53, codeStr: '53', name: 'In Salah', nameAr: 'عين صالح', communes: ['In Salah', 'In Ghar', 'Foggaret Ezzaouia'] },
  { code: 54, codeStr: '54', name: 'In Guezzam', nameAr: 'عين قزام', communes: ['In Guezzam', 'Tin Zaouatine'] },
  { code: 55, codeStr: '55', name: 'Touggourt', nameAr: 'تقرت', communes: ['Touggourt', 'Temacine', 'Megarine', 'Taibet'] },
  { code: 56, codeStr: '56', name: 'Djanet', nameAr: 'جانت', communes: ['Djanet', 'Bordj El Haouas'] },
  { code: 57, codeStr: '57', name: 'El M\'Ghair', nameAr: 'المغير', communes: ['El M\'Ghair', 'Djamaa', 'Oum Touyour'] },
  { code: 58, codeStr: '58', name: 'El Meniaa', nameAr: 'المنيعة', communes: ['El Meniaa', 'Hassi Gara'] },
  { code: 59, codeStr: '59', name: 'Aflou', nameAr: 'أفلو', communes: ['Aflou', 'El Ghicha', 'Oued Morra'] },
  { code: 60, codeStr: '60', name: 'Barika', nameAr: 'بريكة', communes: ['Barika', 'M\'doukal', 'Bitam'] },
  { code: 61, codeStr: '61', name: 'Ksar Chellala', nameAr: 'قصر الشلالة', communes: ['Ksar Chellala', 'Rechaiga', 'Zmalet El Emir Abdelkader'] },
  { code: 62, codeStr: '62', name: 'Messaâd', nameAr: 'مسعد', communes: ['Messaâd', 'Faidh El Botma', 'Selmana'] },
  { code: 63, codeStr: '63', name: 'Aïn Oussara', nameAr: 'عين وسارة', communes: ['Aïn Oussara', 'Benhar', 'El Khemis'] },
  { code: 64, codeStr: '64', name: 'Boussaâda', nameAr: 'بوسعادة', communes: ['Boussaâda', 'El Hamel', 'Oultene'] },
  { code: 65, codeStr: '65', name: 'El Eulma', nameAr: 'العلمة', communes: ['El Eulma', 'Bazer Sakhra', 'Guellal'] },
  { code: 66, codeStr: '66', name: 'Boufarik', nameAr: 'بوفاريك', communes: ['Boufarik', 'Soumaa', 'Guerrouaou'] },
  { code: 67, codeStr: '67', name: 'Larbaâ', nameAr: 'الأربعاء', communes: ['Larbaâ', 'Bougara', 'Meftah'] },
  { code: 68, codeStr: '68', name: 'Cherchell', nameAr: 'شرشال', communes: ['Cherchell', 'Sidi Amar', 'Hadjout'] },
  { code: 69, codeStr: '69', name: 'Maghnia', nameAr: 'مغنية', communes: ['Maghnia', 'Bab El Assa', 'Marsa Ben M\'Hidi'] },
];

export const WILAYA_69_NAMES = ALGERIA_69_WILAYAS.map((w) => `${w.codeStr} - ${w.name}`);

/**
 * Returns a random wilaya from the complete 69 wilayas set
 */
export function getRandom69Wilaya(index: number = 0): string {
  const w = ALGERIA_69_WILAYAS[index % ALGERIA_69_WILAYAS.length];
  const commune = w.communes[Math.floor(index / ALGERIA_69_WILAYAS.length) % w.communes.length] || w.name;
  return `${w.name} - ${commune}`;
}
