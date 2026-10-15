(function () {
'use strict';
const Core = window.AwardCore;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable or full */ } }
};

/* ---------------- strings ---------------- */
const STR = {
en: {
  manufacturingNotice: 'Jaiza Studios provides automated design previews and files that may contain errors and are not certified engineering drawings. Before production, a qualified manufacturer must verify dimensions, materials, tolerances, fit, stability, artwork and suitability for the intended use. Screen previews may differ from the finished product. You must have permission to use submitted text, logos and artwork. Nothing in this notice excludes rights or liabilities that cannot lawfully be excluded.',
  chkManufacturing: 'I understand that these files require manufacturer verification before production, have permission to use my submitted content, and agree to the Terms of Service.',
  appTitle: 'Jaiza Studios', appSub: 'Design custom acrylic awards. Preview freely; sign in to download files for manufacturer review.',
  rulesBtn: 'Manufacturer rules', langBtn: 'عربي',
  signIn: 'Continue with Google', signOut: 'Sign out', adminLink: 'Admin', planLabel: '{name} plan', exportsLabel: 'Exports: {n}',
  suspendedBadge: 'Suspended', signInToDownload: 'Sign in with Google to download the manufacturing files. Designing and previewing work without an account.',
  suspendedNotice: 'Your account is suspended, so files can’t be downloaded. Contact the administrator to restore access.',
  ipBlocked: 'Downloads are blocked for the network you are using (its IP address). You can still sign in, design and preview. If you think this is a mistake, contact the administrator.',
  ipUnknown: 'Downloads are unavailable right now because your network address could not be verified. Please try again later.',
  legalPrivacy: 'Privacy Policy', legalTerms: 'Terms of Service', legalNote: 'By signing in you agree to the',
  suspendedSignin: 'This account is suspended and can’t sign in. Contact the administrator.', signInFailed: 'Sign-in failed: {msg}',
  sessionExpired: 'Your session has ended. Please sign in again.', limitReached: 'You’ve reached this month’s export limit for your plan.',
  serverRejected: 'The server rejected this design: {msg}', tooLarge: 'The design is too large to send (usually the logo). Use a logo under 4 MB.',
  networkError: 'Couldn’t reach the server. Check your connection and try again.', notConfigured: 'Downloads need the account service, which isn’t connected yet (see README).',
  preparingServer: 'Generating your files on the server…', savedNoPng: 'Saved {name} (the artwork PNG couldn’t be added; download it separately).',
  serverFilesNote: 'Files are generated on the server for {email} and counted on your account.',
  rulesReadOnly: 'Set by the administrator. Only the administrator account can change these values.', rulesSave: 'Save for all customers',
  rulesSaved: 'Rules saved for all customers.', rulesSaveFailed: 'Couldn’t save the rules: {msg}',
  s1: 'Shape', s2: 'Size', s3: 'Text & logo', s4: 'Finish', s5: 'Approve',
  s1Title: 'Choose a shape', s1Lede: 'You can set the exact size in the next step.',
  shape_rectangle: 'Rectangle', shape_arch: 'Arch', shape_shield: 'Shield', shape_flame: 'Flame',
  s2Title: 'Choose the size', s2Lede: 'Pick a ready size or drag the sliders. Sizes are shown in centimetres.',
  size_small: 'Small', size_medium: 'Medium', size_large: 'Large', size_custom: 'Custom',
  sizePlaque: 'Plaque {w} × {h}', sizeStands: 'Stands {t} tall', sizeCustomD: 'Your own size, set with the sliders.',
  sizeUnavailable: 'Not available with the current manufacturer rules.',
  howTall: 'How tall?', howWide: 'How wide?',
  howTallBase: 'Plaque only, not including the base. The base adds {b}.', howTallNoBase: 'No base, so this is the full height of the award.',
  howWideHint: 'Measured at the widest point of the plaque.',
  totalBreak: 'Plaque {p} + base {b} = {t}', phoneCmp: 'About {n} × the height of an iPhone 13 ({h}).',
  exactSum: 'Type an exact size', phoneShow: 'Show iPhone 13 for scale', notActual: 'Scaled to fit your screen, not actual size.',
  phoneSub: 'for scale, {h}', sum_size: 'Size',
  units: 'Units', mm: 'mm', cm: 'cm',
  fW: 'Plaque width', fWHint: 'At the widest point.',
  fH: 'Plaque height (above the base)', fHHint: 'From the top of the base to the top of the plaque.',
  fT: 'Acrylic thickness', fTHint: 'Thicker acrylic looks more solid and weighs more.',
  baseH2: 'Base',
  bt_slot: 'Slot-in base', bt_slotD: 'The plaque sits in a pocket cut into the base. Most secure.',
  bt_bonded: 'Glued on top', bt_bondedD: 'The plaque is bonded onto the top of the base.',
  bt_none: 'No base', bt_noneD: 'A thick plaque stands on its own bottom edge.',
  recommended: 'Recommended',
  slotAssume: 'Prototype assumption: the pocket is CNC-routed into a solid base block. Your manufacturer may confirm a different method.',
  bm: 'Base material', bm_black: 'Black acrylic', bm_clear: 'Clear acrylic', bm_frosted: 'Frosted acrylic', bm_wood: 'Wood',
  autoBase: 'Size the base for me', fBW: 'Base width', fBD: 'Base depth', fBH: 'Base height',
  totalLbl: 'Total height with base', totalLblNone: 'Total height', totalNote: 'The finished award standing on a table.',
  s3Title: 'Add text and logo', s3Lede: 'Type in Arabic or English. Lines are centred and sized to fit the shape.',
  exAr: 'Arabic example', exEn: 'English example', exClear: 'Clear text',
  fHeading: 'Title', fName: 'Recipient name', fBody: 'Message', fBodyHint: 'Press Enter to start a new line.', fFooter: 'Date or organization',
  fTextSize: 'Text size', logoH: 'Logo (optional)', logoUpload: 'Upload logo',
  logoTypes: 'A PNG with a transparent background or an SVG works best. JPG is accepted.',
  logoReplace: 'Replace', logoRemove: 'Remove', logoSize: 'Logo size',
  logoErrType: 'Use a PNG, JPG, WebP or SVG file.', logoErrSize: 'The file is larger than 4 MB.', logoErrRead: 'This image couldn’t be read. Try another file.',
  logoNotSaved: 'This logo is too large to keep after a reload; re-upload it if the page is reopened.',
  fitOk: 'Everything fits inside the safe area.',
  safeLegend: 'Dashed line: safe area for text and logo',
  s4Title: 'Choose the finish', s4Lede: 'This changes the artwork files only. The cut shape and the 3D model stay the same.',
  method: 'How is the artwork applied?', m_laser: 'Laser engraving', m_laserD: 'A frosted white look in the acrylic.',
  m_uv: 'UV colour print', m_uvD: 'Printed in the colour you choose.',
  color: 'Print colour', c_black: 'Black', c_navy: 'Navy', c_gold: 'Gold', c_green: 'Green', c_white: 'White',
  side: 'Which surface?', side_front: 'Front surface', side_frontD: 'Applied on the face you look at.',
  side_back: 'Back surface', side_backD: 'Seen through the acrylic for a deeper look. Files are mirrored for the manufacturer.',
  s5Title: 'Approve and download', s5Lede: 'Check everything once more. The manufacturing files are generated from exactly this approved design.',
  orderH: 'Order details', fCustomer: 'Your name', fOrg: 'Organization', fQty: 'Quantity', fNotes: 'Notes for the manufacturer',
  summaryH: 'Summary', sum_shape: 'Shape', sum_plaque: 'Plaque (W × H)', sum_total: 'Total height', sum_thick: 'Thickness',
  sum_base: 'Base', sum_text: 'Text', sum_logo: 'Logo', sum_finish: 'Finish', none: 'None',
  chkSpell: 'I checked the spelling of every line.', chkSize: 'I checked the sizes, including the total height of {total}.',
  chkWarn: 'I read the notes above and want to continue.',
  approveBtn: 'Approve design', blocked: 'Fix the problems marked in red before approving.',
  approvedH: 'Design approved', approvedMeta: 'Reference {ref}, approved {at}',
  editBtn: 'Make changes', changed: 'The design changed after approval. Approve it again to download files.',
  dlH: 'Manufacturing files', dlPkg: 'Download all files (.zip)', dlPkgD: 'One file to send to your manufacturer. It includes a README that explains each file.',
  dl_pdf: 'Drawing (PDF)', dl_stl: '3D model (STL)', dl_dxf: 'Cutting outlines (DXF)', dl_ins: 'Inscription artwork (SVG)',
  dl_logo: 'Logo placement (SVG)', dl_png: 'Artwork image (PNG)', dl_json: 'Design record (JSON)', inZip: '.zip',
  dlNoteZip: 'Inside Claude, STL and DXF are saved inside a .zip because the viewer only accepts certain file types.',
  dlUnavailable: 'Saving files isn’t available in this view.', saved: 'Saved {name}', declined: 'Download cancelled.',
  rateLimited: 'Another download prompt is open. Try again in a moment.', preparing: 'Preparing {name}…', dlFail: 'Couldn’t create {name}: {msg}',
  v_front: 'Front', v_3d: '3D model', v_drawing: 'Drawing',
  hint3d: 'Drag to rotate, scroll or pinch to zoom. This is the exact STL geometry; artwork is a separate overlay.',
  no3d: '3D preview isn’t available in this browser. The STL file is still generated.',
  drawingNote: 'Manufacturer drawing (English). Approving removes the draft mark.', zoom: 'Zoom', fit: 'Fit',
  pv_width: 'Width', pv_plaque: 'Plaque', pv_total: 'Total', ro_plaque: 'Plaque', ro_total: 'Total height', ro_base: 'Base',
  issuesOk: 'No problems found', more: '+{n} more', prev: 'Back', next: 'Next', startOver: 'Start over', startOverQ: 'Click again to clear',
  F_NUM: 'Enter a number.', F_QTY: 'Enter a whole number from 1 to 999.',
  rulesTitle: 'Manufacturer rules',
  rulesLede: 'These values drive every check and every generated file. They are prototype defaults: confirm each one with your manufacturer before production, then tick Confirmed.',
  confirmed: 'Confirmed', rulesReset: 'Reset to prototype defaults', close: 'Close', ruleBad: 'Invalid value, kept the previous one.',
  pendingTip: '{n} rules not yet confirmed by the manufacturer',
  rg_material: 'Material', rg_size: 'Size limits', rg_artwork: 'Artwork', rg_base: 'Base connection', rg_tolerance: 'Tolerances and accuracy',
  r_thicknesses: 'Available acrylic thicknesses (comma separated)', r_plaqueWMin: 'Minimum plaque width', r_plaqueWMax: 'Maximum plaque width',
  r_plaqueHMin: 'Minimum plaque height', r_plaqueHMax: 'Maximum plaque height', r_artMargin: 'Safe margin from the edge for artwork',
  r_minText: 'Minimum text size (font size)', r_slotDepth: 'Tab insertion depth into the base', r_clrT: 'Pocket clearance across thickness (total)',
  r_clrL: 'Pocket clearance along length (total)', r_pocketGap: 'Gap under the tab in the pocket', r_toolR: 'Router tool radius in pocket corners',
  r_shoulder: 'Plaque shoulder width each side of the tab', r_minTab: 'Minimum tab width', r_minFloor: 'Minimum base material under the pocket',
  r_minWall: 'Minimum base wall around the pocket', r_baseHMin: 'Minimum base height', r_baseHMax: 'Maximum base height',
  r_tipFactor: 'Anti-tip guide: base depth ÷ total height', r_freeMinT: 'Minimum thickness without a base',
  r_tolPlaque: 'General tolerance, plaque (±)', r_tolBase: 'General tolerance, base (±)', r_curveTol: 'Curve accuracy in DXF and STL (max deviation)',
  thickBumped: 'Thickness set to {t}, the minimum for a plaque without a base.',
  approvedToast: 'Approved. Your files are ready below.',
  E_W: 'Plaque width must be between {min} and {max}.', E_H: 'Plaque height must be between {min} and {max}.',
  E_T: 'Choose one of the available thicknesses: {list}.',
  E_TAB: 'This shape is too narrow at the bottom for a slot-in base (tab {w}, minimum {min}). Make it wider or choose “Glued on top”.',
  E_BW: 'Base width must be between {min} and {max}.', E_BD: 'Base depth must be between {min} and {max}.', E_BH: 'Base height must be between {min} and {max}.',
  E_FREE_T: 'A plaque without a base must be at least {min} thick.',
  E_TEXT_OUT: '“{line}” goes outside the plaque. Shorten it, reduce the text size, or enlarge the plaque.',
  E_LOGO_OUT: 'The logo goes outside the plaque. Make it smaller.',
  W_TEXT_MARGIN: '“{line}” is closer than {m} to the edge.', W_LOGO_MARGIN: 'The logo is closer than {m} to the edge.',
  W_TOO_MUCH: 'The text is taller than the safe area. Remove a line or enlarge the plaque.',
  W_TEXT_MIN: 'Some lines were reduced to the minimum text size ({min}). Shorter text or a larger plaque will read better.',
  W_GLYPH: 'These characters can’t be produced with the award font: {chars}',
  W_MARKS: 'Arabic diacritics (تشكيل) are placed approximately. Remove them or check the proof carefully.',
  W_TIP: 'The base is shallow for this height and could tip. A depth of at least {d} is recommended.',
  W_TIP_FREE: 'A tall plaque without a base may tip over. Consider adding a base.',
  W_RATIO: 'Unusual proportions. Check that width and height are not swapped.',
  W_POCKET_VISIBLE: 'The ends of the base pocket may show beside the plaque (shoulder narrower than the tool radius rule).',
  W_EMPTY: 'No text or logo yet.', W_LOGO_DPI: 'The logo image is low resolution at this size (about {dpi} dpi). Use a larger image or an SVG.',
  W_LOGO_BG: 'JPG logos have a solid background. A PNG with transparency or an SVG works better.',
  fatal: 'The design engine couldn’t load because a required library was blocked. Reload the page to try again.'
},
ar: {
  manufacturingNotice: 'تقدم جائزة ستوديوز معاينات وملفات تصميم آلية قد تتضمن أخطاء، ولا تعد رسومات هندسية معتمدة. قبل الإنتاج، يجب على جهة تصنيع مؤهلة التحقق من الأبعاد والمواد والتفاوتات والتوافق والثبات والمحتوى وملاءمة الاستخدام. قد تختلف معاينة الشاشة عن المنتج النهائي. يجب أن تملك حق استخدام النصوص والشعارات والأعمال المرفوعة. لا يستبعد هذا التنبيه أي حقوق أو مسؤوليات لا يجوز استبعادها نظاماً.',
  chkManufacturing: 'أفهم أن الملفات تتطلب مراجعة جهة التصنيع قبل الإنتاج، وأملك حق استخدام المحتوى المقدم، وأوافق على شروط الخدمة.',
  appTitle: 'جائزة ستوديوز', appSub: 'صمّم درعاً من الأكريليك وعاينه مجاناً، وسجّل الدخول لتنزيل ملفات لمراجعة جهة التصنيع.',
  rulesBtn: 'قواعد المصنع', langBtn: 'English',
  signIn: 'المتابعة باستخدام Google', signOut: 'تسجيل الخروج', adminLink: 'لوحة الإدارة', planLabel: 'الخطة: {name}', exportsLabel: 'التنزيلات: {n}',
  suspendedBadge: 'موقوف', signInToDownload: 'سجّل الدخول باستخدام Google لتنزيل ملفات التصنيع. التصميم والمعاينة متاحان دون حساب.',
  suspendedNotice: 'حسابك موقوف، لذا لا يمكن تنزيل الملفات. تواصل مع المسؤول لاستعادة الوصول.',
  ipBlocked: 'التنزيل محظور على الشبكة التي تستخدمها (عنوان IP). يمكنك تسجيل الدخول والتصميم والمعاينة كالمعتاد. إذا كنت ترى أن هذا خطأ فتواصل مع المسؤول.',
  ipUnknown: 'التنزيل غير متاح حاليا لتعذّر التحقق من عنوان شبكتك. حاول مرة أخرى لاحقا.',
  legalPrivacy: 'سياسة الخصوصية', legalTerms: 'شروط الخدمة', legalNote: 'بتسجيل الدخول فإنك توافق على',
  suspendedSignin: 'هذا الحساب موقوف ولا يمكنه تسجيل الدخول. تواصل مع المسؤول.', signInFailed: 'تعذّر تسجيل الدخول: {msg}',
  sessionExpired: 'انتهت جلستك. سجّل الدخول مرة أخرى.', limitReached: 'وصلت إلى حد التنزيل الشهري في خطتك.',
  serverRejected: 'رفض الخادم هذا التصميم: {msg}', tooLarge: 'التصميم أكبر من المسموح للإرسال (غالبا بسبب الشعار). استخدم شعارا أقل من 4 ميجابايت.',
  networkError: 'تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.', notConfigured: 'التنزيل يتطلب ربط خدمة الحسابات أولا (راجع README).',
  preparingServer: 'جارٍ إنشاء ملفاتك على الخادم…', savedNoPng: 'تم حفظ {name} (تعذّرت إضافة صورة PNG؛ نزّلها منفصلة).',
  serverFilesNote: 'تُنشأ الملفات على الخادم للحساب {email} وتُحتسب ضمن تنزيلاتك.',
  rulesReadOnly: 'يحددها المسؤول، ولا يمكن تعديلها إلا من حساب المسؤول.', rulesSave: 'حفظ لجميع العملاء',
  rulesSaved: 'حُفظت القواعد لجميع العملاء.', rulesSaveFailed: 'تعذّر حفظ القواعد: {msg}',
  s1: 'الشكل', s2: 'المقاسات', s3: 'النص والشعار', s4: 'التنفيذ', s5: 'الاعتماد',
  s1Title: 'اختر شكل الدرع', s1Lede: 'يمكنك تحديد المقاس بدقة في الخطوة التالية.',
  shape_rectangle: 'مستطيل', shape_arch: 'قوس', shape_shield: 'ترس', shape_flame: 'شعلة',
  s2Title: 'اختر المقاس', s2Lede: 'اختر مقاسا جاهزا أو حرّك المؤشرات. المقاسات معروضة بالسنتيمتر.',
  size_small: 'صغير', size_medium: 'متوسط', size_large: 'كبير', size_custom: 'مخصص',
  sizePlaque: 'اللوحة {w} × {h}', sizeStands: 'الارتفاع الكلي {t}', sizeCustomD: 'مقاسك الخاص عبر المؤشرات.',
  sizeUnavailable: 'غير متاح مع قواعد المصنع الحالية.',
  howTall: 'كم الارتفاع؟', howWide: 'كم العرض؟',
  howTallBase: 'ارتفاع اللوحة فقط دون القاعدة، والقاعدة تضيف {b}.', howTallNoBase: 'لا توجد قاعدة، فهذا هو الارتفاع الكامل للدرع.',
  howWideHint: 'يُقاس عند أعرض نقطة في اللوحة.',
  totalBreak: 'اللوحة {p} + القاعدة {b} = {t}', phoneCmp: 'يعادل نحو {n} × ارتفاع هاتف iPhone 13 ({h}).',
  exactSum: 'اكتب مقاسا دقيقا', phoneShow: 'إظهار iPhone 13 للمقارنة', notActual: 'المعاينة مصغّرة لتناسب الشاشة وليست بالحجم الفعلي.',
  phoneSub: 'للمقارنة، {h}', sum_size: 'المقاس',
  units: 'وحدة القياس', mm: 'مم', cm: 'سم',
  fW: 'عرض اللوحة', fWHint: 'عند أعرض نقطة.',
  fH: 'ارتفاع اللوحة (فوق القاعدة)', fHHint: 'من سطح القاعدة إلى أعلى نقطة في اللوحة.',
  fT: 'سماكة الأكريليك', fTHint: 'السماكة الأكبر تبدو أمتن ووزنها أثقل.',
  baseH2: 'القاعدة',
  bt_slot: 'قاعدة بتجويف', bt_slotD: 'تُثبَّت اللوحة داخل تجويف في القاعدة. الأكثر ثباتا.',
  bt_bonded: 'لصق فوق القاعدة', bt_bondedD: 'تُلصق اللوحة على سطح القاعدة.',
  bt_none: 'بدون قاعدة', bt_noneD: 'لوحة سميكة تقف على حافتها السفلية.',
  recommended: 'موصى به',
  slotAssume: 'افتراض النموذج الأولي: يُفرَّز التجويف آليا (CNC) داخل كتلة قاعدة مصمتة، وقد يعتمد المصنع طريقة أخرى.',
  bm: 'خامة القاعدة', bm_black: 'أكريليك أسود', bm_clear: 'أكريليك شفاف', bm_frosted: 'أكريليك مطفي', bm_wood: 'خشب',
  autoBase: 'احسب مقاس القاعدة تلقائيا', fBW: 'عرض القاعدة', fBD: 'عمق القاعدة', fBH: 'ارتفاع القاعدة',
  totalLbl: 'الارتفاع الكلي مع القاعدة', totalLblNone: 'الارتفاع الكلي', totalNote: 'ارتفاع الدرع كاملا وهو قائم على الطاولة.',
  s3Title: 'أضف النص والشعار', s3Lede: 'اكتب بالعربية أو الإنجليزية. تُوسَّط الأسطر ويُضبط حجمها لتناسب الشكل.',
  exAr: 'مثال عربي', exEn: 'مثال إنجليزي', exClear: 'مسح النص',
  fHeading: 'العنوان', fName: 'اسم المكرَّم', fBody: 'نص الرسالة', fBodyHint: 'اضغط Enter لبدء سطر جديد.', fFooter: 'التاريخ أو الجهة',
  fTextSize: 'حجم النص', logoH: 'الشعار (اختياري)', logoUpload: 'رفع الشعار',
  logoTypes: 'يفضَّل ملف PNG بخلفية شفافة أو SVG، ويُقبل JPG.',
  logoReplace: 'استبدال', logoRemove: 'حذف', logoSize: 'حجم الشعار',
  logoErrType: 'استخدم ملف PNG أو JPG أو WebP أو SVG.', logoErrSize: 'حجم الملف أكبر من 4 ميجابايت.', logoErrRead: 'تعذّرت قراءة الصورة. جرّب ملفا آخر.',
  logoNotSaved: 'الشعار كبير جدا ليُحفظ بعد إعادة التحميل؛ ارفعه مجددا إذا أعدت فتح الصفحة.',
  fitOk: 'جميع العناصر داخل المساحة الآمنة.',
  safeLegend: 'الخط المتقطع: المساحة الآمنة للنص والشعار',
  s4Title: 'اختر طريقة التنفيذ', s4Lede: 'يؤثر هذا على ملفات النص والشعار فقط، ولا يغيّر شكل القص أو المجسم.',
  method: 'كيف يُنفَّذ النص والشعار؟', m_laser: 'حفر بالليزر', m_laserD: 'مظهر أبيض مطفي داخل الأكريليك.',
  m_uv: 'طباعة ملونة UV', m_uvD: 'طباعة باللون الذي تختاره.',
  color: 'لون الطباعة', c_black: 'أسود', c_navy: 'كحلي', c_gold: 'ذهبي', c_green: 'أخضر', c_white: 'أبيض',
  side: 'على أي وجه؟', side_front: 'الوجه الأمامي', side_frontD: 'يُنفَّذ على الوجه الذي تراه.',
  side_back: 'الوجه الخلفي', side_backD: 'يُرى عبر الأكريليك بعمق أكبر، وتُعكس الملفات للمصنع.',
  s5Title: 'الاعتماد والتنزيل', s5Lede: 'راجع كل شيء مرة أخيرة. تُنشأ ملفات التصنيع من هذا التصميم المعتمد نفسه.',
  orderH: 'بيانات الطلب', fCustomer: 'اسمك', fOrg: 'الجهة', fQty: 'الكمية', fNotes: 'ملاحظات للمصنع',
  summaryH: 'الملخص', sum_shape: 'الشكل', sum_plaque: 'اللوحة (العرض × الارتفاع)', sum_total: 'الارتفاع الكلي', sum_thick: 'السماكة',
  sum_base: 'القاعدة', sum_text: 'النص', sum_logo: 'الشعار', sum_finish: 'التنفيذ', none: 'لا يوجد',
  chkSpell: 'راجعت إملاء جميع الأسطر.', chkSize: 'راجعت المقاسات، ومنها الارتفاع الكلي {total}.',
  chkWarn: 'اطلعت على الملاحظات أعلاه وأرغب في المتابعة.',
  approveBtn: 'اعتماد التصميم', blocked: 'صحّح المشكلات المعلَّمة بالأحمر قبل الاعتماد.',
  approvedH: 'تم اعتماد التصميم', approvedMeta: 'المرجع {ref}، اعتُمد في {at}',
  editBtn: 'إجراء تعديلات', changed: 'تغيّر التصميم بعد الاعتماد. اعتمده مرة أخرى لتنزيل الملفات.',
  dlH: 'ملفات التصنيع', dlPkg: 'تنزيل جميع الملفات (zip)', dlPkgD: 'ملف واحد لإرساله إلى المصنع، ومعه ملف README يشرح كل ملف.',
  dl_pdf: 'الرسم الهندسي (PDF)', dl_stl: 'المجسم ثلاثي الأبعاد (STL)', dl_dxf: 'خطوط القص (DXF)', dl_ins: 'ملف النص (SVG)',
  dl_logo: 'موضع الشعار (SVG)', dl_png: 'صورة التصميم (PNG)', dl_json: 'سجل التصميم (JSON)', inZip: 'zip',
  dlNoteZip: 'داخل Claude تُحفَظ ملفات STL وDXF ضمن ملف zip لأن العارض يقبل أنواعا محددة من الملفات فقط.',
  dlUnavailable: 'حفظ الملفات غير متاح في هذا العرض.', saved: 'تم حفظ {name}', declined: 'أُلغي التنزيل.',
  rateLimited: 'هناك نافذة تنزيل مفتوحة. حاول بعد لحظة.', preparing: 'جارٍ تجهيز {name}…', dlFail: 'تعذّر إنشاء {name}: {msg}',
  v_front: 'الواجهة', v_3d: 'المجسم', v_drawing: 'الرسم الهندسي',
  hint3d: 'اسحب للتدوير، واستخدم العجلة أو إصبعين للتكبير. هذا هو مجسم ملف STL نفسه، والنص طبقة منفصلة.',
  no3d: 'المعاينة ثلاثية الأبعاد غير متاحة في هذا المتصفح، وسيُنشأ ملف STL كالمعتاد.',
  drawingNote: 'الرسم الهندسي للمصنع (بالإنجليزية). يُزال وسم المسودة بعد الاعتماد.', zoom: 'تكبير', fit: 'ملاءمة',
  pv_width: 'العرض', pv_plaque: 'اللوحة', pv_total: 'الكلي', ro_plaque: 'اللوحة', ro_total: 'الارتفاع الكلي', ro_base: 'القاعدة',
  issuesOk: 'لا توجد مشكلات', more: '+{n} أخرى', prev: 'السابق', next: 'التالي', startOver: 'البدء من جديد', startOverQ: 'اضغط مرة أخرى للمسح',
  F_NUM: 'أدخل رقما.', F_QTY: 'أدخل عددا صحيحا من 1 إلى 999.',
  rulesTitle: 'قواعد المصنع',
  rulesLede: 'تتحكم هذه القيم في كل عمليات التحقق وفي جميع الملفات الناتجة. هي قيم افتراضية للنموذج الأولي، فتأكد من كل قيمة مع المصنع قبل الإنتاج ثم علّم «مؤكد».',
  confirmed: 'مؤكد', rulesReset: 'استعادة القيم الافتراضية', close: 'إغلاق', ruleBad: 'قيمة غير صالحة، أُبقيت القيمة السابقة.',
  pendingTip: '{n} من القواعد لم يؤكدها المصنع بعد',
  rg_material: 'الخامة', rg_size: 'حدود المقاسات', rg_artwork: 'النص والشعار', rg_base: 'تثبيت القاعدة', rg_tolerance: 'التفاوتات والدقة',
  r_thicknesses: 'سماكات الأكريليك المتوفرة (مفصولة بفواصل)', r_plaqueWMin: 'أقل عرض للوحة', r_plaqueWMax: 'أكبر عرض للوحة',
  r_plaqueHMin: 'أقل ارتفاع للوحة', r_plaqueHMax: 'أكبر ارتفاع للوحة', r_artMargin: 'الهامش الآمن من الحافة للنص والشعار',
  r_minText: 'أصغر حجم للنص', r_slotDepth: 'عمق إدخال اللسان في القاعدة', r_clrT: 'خلوص التجويف في اتجاه السماكة (إجمالي)',
  r_clrL: 'خلوص التجويف في اتجاه الطول (إجمالي)', r_pocketGap: 'فراغ أسفل اللسان داخل التجويف', r_toolR: 'نصف قطر أداة التفريز في زوايا التجويف',
  r_shoulder: 'عرض كتف اللوحة على جانبي اللسان', r_minTab: 'أقل عرض للسان', r_minFloor: 'أقل سماكة للقاعدة أسفل التجويف',
  r_minWall: 'أقل جدار للقاعدة حول التجويف', r_baseHMin: 'أقل ارتفاع للقاعدة', r_baseHMax: 'أكبر ارتفاع للقاعدة',
  r_tipFactor: 'دليل منع الانقلاب: عمق القاعدة ÷ الارتفاع الكلي', r_freeMinT: 'أقل سماكة بدون قاعدة',
  r_tolPlaque: 'التفاوت العام للوحة (±)', r_tolBase: 'التفاوت العام للقاعدة (±)', r_curveTol: 'دقة المنحنيات في DXF وSTL (أقصى انحراف)',
  thickBumped: 'ضُبطت السماكة على {t}، وهي الحد الأدنى للوحة بدون قاعدة.',
  approvedToast: 'تم الاعتماد. ملفاتك جاهزة في الأسفل.',
  E_W: 'يجب أن يكون عرض اللوحة بين {min} و{max}.', E_H: 'يجب أن يكون ارتفاع اللوحة بين {min} و{max}.',
  E_T: 'اختر سماكة من المتوفر: {list}.',
  E_TAB: 'أسفل هذا الشكل ضيق جدا للتثبيت بالتجويف (اللسان {w} والحد الأدنى {min}). زِد العرض أو اختر «لصق فوق القاعدة».',
  E_BW: 'يجب أن يكون عرض القاعدة بين {min} و{max}.', E_BD: 'يجب أن يكون عمق القاعدة بين {min} و{max}.', E_BH: 'يجب أن يكون ارتفاع القاعدة بين {min} و{max}.',
  E_FREE_T: 'يجب ألا تقل سماكة اللوحة بدون قاعدة عن {min}.',
  E_TEXT_OUT: '«{line}» يتجاوز حدود اللوحة. اختصره أو صغّر النص أو كبّر اللوحة.',
  E_LOGO_OUT: 'الشعار يتجاوز حدود اللوحة. صغّر حجمه.',
  W_TEXT_MARGIN: '«{line}» أقرب من {m} إلى الحافة.', W_LOGO_MARGIN: 'الشعار أقرب من {m} إلى الحافة.',
  W_TOO_MUCH: 'النص أطول من المساحة الآمنة. احذف سطرا أو كبّر اللوحة.',
  W_TEXT_MIN: 'صُغّرت بعض الأسطر إلى أصغر حجم مسموح ({min}). النص الأقصر أو اللوحة الأكبر أوضح للقراءة.',
  W_GLYPH: 'هذه الأحرف غير متوفرة في خط الدرع: {chars}',
  W_MARKS: 'التشكيل يوضع بشكل تقريبي. احذفه أو راجع المعاينة بعناية.',
  W_TIP: 'القاعدة قليلة العمق لهذا الارتفاع وقد ينقلب الدرع. يُنصح بعمق لا يقل عن {d}.',
  W_TIP_FREE: 'اللوحة الطويلة بدون قاعدة قد تنقلب. فكّر في إضافة قاعدة.',
  W_RATIO: 'نسب غير معتادة. تأكد أن العرض والارتفاع غير متبادلين.',
  W_POCKET_VISIBLE: 'قد تظهر أطراف التجويف بجانب اللوحة (الكتف أضيق من قاعدة نصف قطر الأداة).',
  W_EMPTY: 'لم يُضف نص أو شعار بعد.', W_LOGO_DPI: 'دقة صورة الشعار منخفضة لهذا الحجم (حوالي {dpi} نقطة/بوصة). استخدم صورة أكبر أو ملف SVG.',
  W_LOGO_BG: 'شعارات JPG لها خلفية مصمتة. يُفضَّل PNG بخلفية شفافة أو SVG.',
  fatal: 'تعذّر تحميل محرك التصميم لأن إحدى المكتبات حُجبت. أعد تحميل الصفحة.'
}};
const RULE_SHORT = { thicknesses: 'thickness stock', plaqueWMin: 'size limits', plaqueWMax: 'size limits', plaqueHMin: 'size limits', plaqueHMax: 'size limits',
  artMargin: 'artwork margin', minText: 'min text size', slotDepth: 'tab depth', clrT: 'pocket clearances', clrL: 'pocket clearances', pocketGap: 'pocket clearances',
  toolR: 'router radius', shoulder: 'shoulder width', minTab: 'min tab width', minFloor: 'base floor', minWall: 'base walls', baseHMin: 'base height range',
  baseHMax: 'base height range', tipFactor: 'anti-tip guide', freeMinT: 'freestanding thickness', tolPlaque: 'tolerances', tolBase: 'tolerances', curveTol: 'curve accuracy' };
const ALL_RULES = Core.RULE_GROUPS.flatMap(g => g[1]);

/* ---------------- state ---------------- */
function merge(def, v) {
  if (v === null || v === undefined || typeof v !== 'object' || Array.isArray(v) || typeof def !== 'object' || def === null || Array.isArray(def)) return v === undefined || v === null ? def : v;
  const o = Object.assign({}, def);
  for (const k of Object.keys(v)) o[k] = (k in def) ? merge(def[k], v[k]) : v[k];
  return o;
}
let P = merge(Core.defaultParams(), store.get('aw.params'));
let RULES = Core.normalizeRules({}); // replaced by the administrator's rules from the server on load (fresh copy: never mutates the defaults)
let CONF = {};
const uiStored = store.get('aw.ui');
const UI = merge({ lang: 'en', units: 'cm', step: 1, seen: [1], view: 'front', phone: true, v: 2 }, uiStored);
if (!uiStored || uiStored.v !== 2) { UI.units = 'cm'; UI.phone = true; UI.v = 2; }
let approval = store.get('aw.approval');
const checks = { spell: false, size: false, warn: false, manufacturing: false };
const parseErr = {};
let model = null, logoImg = null, logoPng = null, logoFrost = null, logoHash = '', logoTooBig = false, zoomed = false;

const T = (k, v) => {
  let s = (STR[UI.lang] && STR[UI.lang][k] != null) ? STR[UI.lang][k] : (STR.en[k] != null ? STR.en[k] : k);
  if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => v[n] != null ? v[n] : m);
  return s;
};
const unitLbl = () => T(UI.units);
const toDisp = mm => UI.units === 'cm' ? Core.fmt(mm / 10) : Core.fmt(mm);
const lenTxt = mm => `${toDisp(mm)} ${unitLbl()}`;
function parseNum(s) {
  s = String(s).trim().replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x6F0).replace(/[٫,]/g, '.').replace(/\s+/g, '');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return parseFloat(s);
}
function designHash() {
  const p = Object.assign({}, P, { logo: P.logo ? { h: logoHash, n: P.logo.name } : null }); delete p.sizePreset;
  return Core.hash(JSON.stringify(p) + '|' + JSON.stringify(RULES));
}
const approvedValid = () => !!(approval && approval.noticeVersion === '2026-10-15' && approval.hash === designHash());
const fmtDateEn = d => { const z = n => String(n).padStart(2, '0'); d = new Date(d); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
const fmtDateUi = d => { try { return new Date(d).toLocaleString(UI.lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return fmtDateEn(d); } };

function persist() {
  const p = Object.assign({}, P);
  logoTooBig = !!(P.logo && P.logo.dataUrl.length > 2.5e6);
  if (logoTooBig) p.logo = null;
  store.set('aw.params', p); store.set('aw.ui', UI); store.set('aw.approval', approval);
}
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3200); }

/* ---------------- boot checks ---------------- */
if (!Core || !window.opentype || !window.earcut) {
  $('#app').innerHTML = `<div class="fatal">${esc(STR.en.fatal)}<br><span lang="ar" dir="rtl">${esc(STR.ar.fatal)}</span></div>`;
  return;
}
function b64buf(b) { const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
const regBuf = b64buf(FONT_REG_B64), boldBuf = b64buf(FONT_BOLD_B64);
Core.setDeps({ opentype: window.opentype, earcut: window.earcut });
Core.initFonts(regBuf, boldBuf);
try {
  [[regBuf, '400'], [boldBuf, '700']].forEach(([b, w]) => { const f = new FontFace('Plex Arabic', b.slice(0), { weight: w }); f.load().then(ff => document.fonts.add(ff)).catch(() => {}); });
} catch (e) { /* CSS fallback fonts */ }

/* ---------------- downloads capability ---------------- */
let DL = null, DLMODE = (window.claude && typeof window.claude.use === 'function') ? 'pending' : 'anchor';
if (DLMODE === 'pending') {
  window.claude.use('downloads').then(ns => { DL = ns; DLMODE = ns ? 'claude' : (window.self === window.top ? 'anchor' : 'none'); renderApprove(true); })
    .catch(() => { DLMODE = window.self === window.top ? 'anchor' : 'none'; renderApprove(true); });
}
async function saveFile(name, data) {
  if (DLMODE === 'claude' && DL) {
    try { await DL.save({ filename: name, data }); toast(T('saved', { name })); }
    catch (e) { const c = e && e.code; if (c === 'declined') toast(T('declined')); else if (c === 'rate_limited') toast(T('rateLimited')); else if (c === 'unavailable' || c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed') toast(T('dlUnavailable')); else toast(T('dlFail', { name, msg: (e && e.message) || c || 'error' })); }
    return;
  }
  if (DLMODE === 'anchor') {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    toast(T('saved', { name })); return;
  }
  toast(T('dlUnavailable'));
}

/* ---------------- logo handling ---------------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; });
const readDataUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
function b64utf8(s) { const u = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(bin); }
function fixSvg(txt) {
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml'), svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new Error('svg');
  const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const wa = svg.getAttribute('width') || '', ha = svg.getAttribute('height') || '';
  const w = parseFloat(wa), h = parseFloat(ha);
  if (!(w > 0 && h > 0) || /%/.test(wa + ha)) {
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { const s = 1000 / Math.max(vb[2], vb[3]); svg.setAttribute('width', vb[2] * s); svg.setAttribute('height', vb[3] * s); }
    else { svg.setAttribute('width', 1000); svg.setAttribute('height', 1000); }
  }
  return { txt: new XMLSerializer().serializeToString(doc), w: parseFloat(svg.getAttribute('width')), h: parseFloat(svg.getAttribute('height')) };
}
function prepareLogo() {
  logoPng = null; logoFrost = null;
  if (!logoImg || !P.logo) return;
  const s = Math.min(1, 640 / Math.max(P.logo.pxW, P.logo.pxH));
  const w = Math.max(1, Math.round(P.logo.pxW * s)), h = Math.max(1, Math.round(P.logo.pxH * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(logoImg, 0, 0, w, h);
  try {
    logoPng = c.toDataURL('image/png');
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255, lum = (d[i] + d[i + 1] + d[i + 2]) / 765; d[i] = 242; d[i + 1] = 250; d[i + 2] = 255; d[i + 3] = Math.round(255 * Math.max(0, (1 - lum) * a)); }
    const f = document.createElement('canvas'); f.width = w; f.height = h; f.getContext('2d').putImageData(id, 0, 0); logoFrost = f;
  } catch (e) { logoPng = null; logoFrost = null; }
}
async function takeLogo(file) {
  const err = $('#errLogo'); err.hidden = true;
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
  if (!isSvg && !/^image\/(png|jpeg|webp)$/.test(file.type)) { err.textContent = T('logoErrType'); err.hidden = false; return; }
  if (file.size > 4e6) { err.textContent = T('logoErrSize'); err.hidden = false; return; }
  try {
    let dataUrl, pxW, pxH;
    if (isSvg) { const f = fixSvg(await file.text()); dataUrl = 'data:image/svg+xml;base64,' + b64utf8(f.txt); pxW = f.w; pxH = f.h; }
    else dataUrl = await readDataUrl(file);
    const img = await loadImg(dataUrl);
    if (!isSvg) { pxW = img.naturalWidth; pxH = img.naturalHeight; }
    if (!(pxW > 0 && pxH > 0)) throw new Error('size');
    P.logo = { dataUrl, mime: isSvg ? 'image/svg+xml' : file.type, name: file.name, pxW, pxH, svg: isSvg, bytes: file.size };
    logoImg = img; logoHash = Core.hash(dataUrl); prepareLogo(); refreshLogoUI(); schedule();
  } catch (e) { err.textContent = T('logoErrRead'); err.hidden = false; }
}
function refreshLogoUI() {
  const has = !!P.logo;
  $('#logoEmpty').hidden = has; $('#logoFull').hidden = !has;
  if (has) {
    $('#logoThumb').src = logoPng || P.logo.dataUrl;
    const kb = P.logo.bytes ? ` · ${Math.round(P.logo.bytes / 1024)} KB` : '';
    $('#logoMeta').textContent = `${P.logo.name}${P.logo.svg ? ' (SVG)' : ` (${P.logo.pxW}×${P.logo.pxH}px)`}${kb}${logoTooBig ? ' ' + T('logoNotSaved') : ''}`;
    $('#lScale').value = Math.round((P.logoScale || 1) * 100); $('#lScaleOut').textContent = $('#lScale').value + '%';
  }
}

/* ---------------- static pieces (re-rendered on language/selection change) ---------------- */
function shapeThumb(shape) {
  const pts = Core.shapeOutline(shape, 100, 128, RULES);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + (p[0] + 60).toFixed(1) + ' ' + (138 - p[1]).toFixed(1)).join('') + 'Z';
  return `<svg viewBox="0 0 120 156" aria-hidden="true"><path d="${d}"/><rect x="16" y="138" width="88" height="15" rx="2"/></svg>`;
}
function renderStatic() {
  $('#steps').innerHTML = [1, 2, 3, 4, 5].map(n => `<li><button type="button" data-goto="${n}" ${UI.step === n ? 'aria-current="step"' : ''} class="${UI.seen.includes(n) ? 'seen' : ''}"><span class="n">${n}</span><span>${esc(T('s' + n))}</span><i class="flag" data-flag="${n}" hidden></i></button></li>`).join('');
  $('#shapeGrid').innerHTML = Core.SHAPES.map(s => `<button type="button" class="card shape-tile" data-shape="${s}" aria-pressed="${P.shape === s}">${shapeThumb(s)}<strong>${esc(T('shape_' + s))}</strong></button>`).join('');
  $('#thickChips').innerHTML = RULES.thicknesses.map(t => `<button type="button" class="chip" data-thick="${t}" aria-pressed="${P.t === t}" title="${t} mm">${esc(thickTxt(t))}</button>`).join('');
  $('#baseTypes').innerHTML = ['slot', 'bonded', 'none'].map(b => `<button type="button" class="card" data-bt="${b}" aria-pressed="${P.base.type === b}"><i class="radio"></i><span><strong>${esc(T('bt_' + b))}</strong><span>${esc(T('bt_' + b + 'D'))}</span>${b === 'slot' ? `<span class="tag">${esc(T('recommended'))}</span>` : ''}</span></button>`).join('');
  $('#baseMat').innerHTML = Core.BASE_MATERIALS.map(m => `<button type="button" class="chip" data-bm="${m}" aria-pressed="${P.base.material === m}">${esc(T('bm_' + m))}</button>`).join('');
  $('#baseOpts').hidden = P.base.type === 'none';
  $('#slotAssume').hidden = P.base.type !== 'slot';
  $('#autoBase').checked = !!P.base.auto;
  $('#methodCards').innerHTML = ['laser', 'uv'].map(m => `<button type="button" class="card" data-method="${m}" aria-pressed="${P.finish.method === m}"><i class="radio"></i><span><strong>${esc(T('m_' + m))}</strong><span>${esc(T('m_' + m + 'D'))}</span></span></button>`).join('');
  const sw = [['black', '#000000'], ['navy', '#1d2433'], ['gold', '#b8892e'], ['green', '#0f6b5c'], ['white', '#ffffff']];
  $('#swatches').innerHTML = sw.map(([n, c]) => `<button type="button" class="sw" data-color="${c}" style="background:${c}" aria-pressed="${P.finish.color === c}" aria-label="${esc(T('c_' + n))}" title="${esc(T('c_' + n))}"></button>`).join('');
  $('#colorField').hidden = P.finish.method !== 'uv';
  $('#sideCards').innerHTML = ['front', 'back'].map(s => `<button type="button" class="card" data-side="${s}" aria-pressed="${P.finish.side === s}"><i class="radio"></i><span><strong>${esc(T('side_' + s))}</strong><span>${esc(T('side_' + s + 'D'))}</span></span></button>`).join('');
  document.querySelectorAll('.step').forEach(el => { el.hidden = +el.dataset.step !== UI.step; });
  $('#prevBtn').style.visibility = UI.step > 1 ? 'visible' : 'hidden';
  $('#nextBtn').hidden = UI.step === 5;
  document.querySelectorAll('#viewTabs [data-view]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === UI.view)));
  $('#viewFront').hidden = UI.view !== 'front'; $('#view3d').hidden = UI.view !== '3d'; $('#viewDrawing').hidden = UI.view !== 'drawing';
  $('#legend').hidden = UI.view !== 'front';
  $('#phoneToggle').checked = !!UI.phone;
  document.querySelectorAll('#unitSeg [data-u]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.u === UI.units)));
  document.querySelectorAll('.u-len').forEach(e => { e.textContent = unitLbl(); });
  $('#tScale').value = Math.round((P.textScale || 1) * 100); $('#tScaleOut').textContent = $('#tScale').value + '%';
  const n = ALL_RULES.filter(k => !CONF[k]).length;
  $('#pendingPill').textContent = n ? String(n) : ''; $('#pendingPill').hidden = !n; $('#btnRules').title = n ? T('pendingTip', { n }) : '';
  $('#zoomBtn').textContent = zoomed ? T('fit') : T('zoom');
}
function applyLang() {
  const html = document.documentElement;
  html.lang = UI.lang; html.dir = UI.lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T(el.dataset.t); });
  const lb = $('#btnLang'); lb.textContent = T('langBtn'); lb.lang = UI.lang === 'ar' ? 'en' : 'ar';
  document.title = UI.lang === 'ar' ? 'جائزة ستوديوز | Jaiza Studios — تصميم دروع الأكريليك' : 'Jaiza Studios — Custom Acrylic Award Designer';
  renderStatic(); refreshLogoUI(); fillFields(); lastApproveSig = ''; schedule();
  if (typeof renderAccount === 'function' && typeof account !== 'undefined') renderAccount();
  if ($('#rulesDlg').open) renderRules();
}
function fillNum(id, mm) { const el = $(id); if (document.activeElement !== el) el.value = toDisp(mm); }
function fillFields() {
  if (!parseErr.W) fillNum('#inW', P.W);
  if (!parseErr.H) fillNum('#inH', P.H);
  const b = (model && model.base) || P.base;
  if (!parseErr.baseW) fillNum('#inBW', P.base.auto ? b.W : P.base.W);
  if (!parseErr.baseD) fillNum('#inBD', P.base.auto ? b.D : P.base.D);
  if (!parseErr.baseH) fillNum('#inBH', P.base.auto ? b.H : P.base.H);
  ['#inBW', '#inBD', '#inBH'].forEach(id => { $(id).disabled = !!P.base.auto; });
  const map = { '#tHeading': 'heading', '#tName': 'name', '#tBody': 'body', '#tFooter': 'footer' };
  for (const id in map) { const el = $(id); if (document.activeElement !== el) el.value = P.text[map[id]] || ''; }
  ['customer', 'org', 'notes'].forEach(k => { const el = document.querySelector(`[data-meta="${k}"]`); if (document.activeElement !== el) el.value = P.meta[k] || ''; });
  if (!parseErr.qty && document.activeElement !== $('#mQty')) $('#mQty').value = String(P.meta.qty || 1);
}

/* ---------------- sizing for non-engineers ---------------- */
const SIZE_ERR = ['E_W', 'E_H', 'E_TAB', 'E_BW', 'E_BD', 'E_BH', 'E_FREE_T', 'E_T'];
function activePreset() {
  if (P.sizePreset && P.sizePreset !== 'custom') { const s = Core.presetSize(P.sizePreset, RULES); if (s && Math.abs(s.W - P.W) < 1e-6 && Math.abs(s.H - P.H) < 1e-6) return P.sizePreset; }
  return 'custom';
}
const presetCache = new Map();
function presetInfo(name) {
  const sz = Core.presetSize(name, RULES);
  const key = [name, P.shape, P.t, P.base.type, JSON.stringify(RULES)].join('|');
  if (!presetCache.has(key)) {
    const cand = Object.assign({}, P, { W: sz.W, H: sz.H, text: {}, logo: null, base: Object.assign({}, P.base, { auto: true }) });
    const m = Core.build(cand, RULES);
    const errs = m.errors.filter(e => SIZE_ERR.includes(e.code));
    if (presetCache.size > 60) presetCache.clear();
    presetCache.set(key, { W: sz.W, H: sz.H, Ht: m.Ht, plW: m.vbb.x1 - m.vbb.x0, ok: !errs.length, why: errs.length ? msgText(errs[0]) : '' });
  }
  return presetCache.get(key);
}
function sizeThumb(W, H, scale) {
  const pts = Core.shapeOutline(P.shape, W, H, RULES), k = scale;
  const d = pts.map((p, i) => (i ? 'L' : 'M') + (60 + p[0] * k).toFixed(1) + ' ' + (52 - p[1] * k).toFixed(1)).join('') + 'Z';
  return `<svg viewBox="0 0 120 58" aria-hidden="true"><path d="${d}"/><rect x="${(60 - (W * k + 8) / 2).toFixed(1)}" y="52" width="${(W * k + 8).toFixed(1)}" height="5" rx="1"/></svg>`;
}
function renderSizing() {
  const cur = activePreset();
  const cards = ['small', 'medium', 'large'].map(n => {
    const i = presetInfo(n);
    const sub = i.ok ? `${T('sizePlaque', { w: toDisp(i.plW), h: lenTxt(i.H) })}<br>${T('sizeStands', { t: lenTxt(i.Ht) })}` : esc(T('sizeUnavailable'));
    return `<button type="button" class="card" data-size="${n}" aria-pressed="${cur === n}" ${i.ok ? '' : `disabled title="${esc(i.why)}"`}>${sizeThumb(i.W, i.H, 50 / 260)}<strong>${esc(T('size_' + n))}</strong><span>${sub}</span></button>`;
  });
  cards.push(`<button type="button" class="card" data-size="custom" aria-pressed="${cur === 'custom'}"><svg viewBox="0 0 120 58" aria-hidden="true"><path d="M20 20h80M20 38h80" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="72" cy="20" r="7" fill="currentColor"/><circle cx="44" cy="38" r="7" fill="currentColor"/></svg><strong>${esc(T('size_custom'))}</strong><span>${esc(T('sizeCustomD'))}</span></button>`);
  const html = cards.join('');
  const box = $('#sizePresets'); if (box.dataset.html !== html) { box.innerHTML = html; box.dataset.html = html; }
  const sl = (id, min, max, val) => { const el = $(id); el.min = min; el.max = max; if (document.activeElement !== el) el.value = Math.min(max, Math.max(min, val)); el.setAttribute('aria-valuetext', lenTxt(val)); };
  sl('#slH', RULES.plaqueHMin, RULES.plaqueHMax, P.H); sl('#slW', RULES.plaqueWMin, RULES.plaqueWMax, P.W);
  $('#slHOut').textContent = lenTxt(model.H); $('#slWOut').textContent = lenTxt(model.vbb.x1 - model.vbb.x0);
  $('#slHHint').textContent = model.base ? T('howTallBase', { b: lenTxt(model.base.H) }) : T('howTallNoBase');
  $('#totalLbl').textContent = T(model.base ? 'totalLbl' : 'totalLblNone');
  $('#totalVal').textContent = lenTxt(model.Ht);
  $('#totalBreak').textContent = model.base ? T('totalBreak', { p: lenTxt(model.H), b: lenTxt(model.base.H), t: lenTxt(model.Ht) }) : '';
  $('#totalBreak').hidden = !model.base;
  $('#phoneCmp').textContent = T('phoneCmp', { n: (Math.round(model.Ht / Core.PHONE.h * 10) / 10).toFixed(1), h: lenTxt(Core.PHONE.h) });
  const se = model.errors.filter(m => m.field === 'W' || m.field === 'H').map(msgText);
  if (parseErr.W || parseErr.H) se.push(T('F_NUM'));
  $('#errSize').textContent = se.join(' '); $('#errSize').hidden = !se.length;
  if (se.length) $('#exactBox').open = true;
}

/* ---------------- render loop ---------------- */
let raf = 0;
function schedule() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; rebuild(); }); }
function rebuild() {
  model = Core.build(P, RULES);
  if (approval && !approvedValid() && !approval.stale) approval.stale = true;
  renderFront(); renderReadout(); renderIssues(); renderFieldErrors(); renderFlags(); renderTotal(); renderFit(); renderSummary(); renderApprove();
  if (P.base.auto) fillFields();
  if (UI.view === '3d') V3.update(); else V3.dirty = true;
  if (UI.view === 'drawing') renderDrawing();
  persist();
}
const previewP = () => P.logo ? Object.assign({}, P, { logo: Object.assign({}, P.logo, { dataUrl: logoPng || P.logo.dataUrl }) }) : P;
function renderFront() {
  $('#viewFront').innerHTML = Core.previewSVG(model, previewP(), { labels: { width: T('pv_width'), plaque: T('pv_plaque'), total: T('pv_total'), unit: v => lenTxt(v) }, label: T('v_front'), phone: UI.phone ? { title: Core.PHONE.name, sub: T('phoneSub', { h: lenTxt(Core.PHONE.h) }) } : null });
}
function renderReadout() {
  const M = model, u = esc(unitLbl());
  const parts = [`<span>${esc(T('ro_plaque'))} <b>${toDisp(M.vbb.x1 - M.vbb.x0)} × ${toDisp(M.H)}</b> ${u}</span>`,
    `<span class="tot">${esc(T('ro_total'))} <b>${esc(lenTxt(M.Ht))}</b></span>`,
    `<span>${esc(T('sum_thick'))} <b>${esc(thickTxt(M.t))}</b></span>`];
  if (M.base) parts.push(`<span>${esc(T('ro_base'))} <b>${toDisp(M.base.W)} × ${toDisp(M.base.D)} × ${toDisp(M.base.H)}</b> ${u}</span>`);
  $('#readout').innerHTML = parts.join('');
}
const FIELD_STEP = { W: 2, H: 2, t: 2, baseW: 2, baseD: 2, baseH: 2, text: 3, logo: 3 };
const LEN_KEYS = ['min', 'max', 'w', 'm', 'd'];
const msgText = m => {
  const v = Object.assign({}, m.vals);
  if (/^(E_|W_)/.test(m.code) && m.code !== 'W_LOGO_DPI') for (const k of LEN_KEYS) if (v[k] != null && v[k] !== '' && !isNaN(+v[k])) v[k] = lenTxt(+v[k]);
  if (m.code === 'E_T' && v.list) v.list = String(v.list).split(/,\s*/).map(Number).map(toDisp).join(', ') + ' ' + unitLbl();
  return T(m.code, v);
};
const thickTxt = t => lenTxt(t);
function allIssues() {
  const list = model.errors.concat(model.warnings).map(m => ({ lv: m.lv, txt: msgText(m), step: FIELD_STEP[m.field] || 2 }));
  if (Object.keys(parseErr).length) list.unshift({ lv: 'error', txt: T(parseErr.qty && Object.keys(parseErr).length === 1 ? 'F_QTY' : 'F_NUM'), step: parseErr.qty && Object.keys(parseErr).length === 1 ? 5 : 2 });
  return list;
}
function renderIssues() {
  const list = allIssues();
  if (!list.length) { $('#issues').innerHTML = `<span class="issue ok">${esc(T('issuesOk'))}</span>`; return; }
  const shown = list.slice(0, 3);
  $('#issues').innerHTML = shown.map(i => `<button type="button" class="issue ${i.lv}" data-goto="${i.step}">${esc(i.txt)}</button>`).join('') + (list.length > 3 ? `<span class="issue ${list[3].lv}">${esc(T('more', { n: list.length - 3 }))}</span>` : '');
}
function renderFieldErrors() {
  const by = f => model.errors.filter(m => m.field === f).map(msgText);
  const put = (id, arr, wrap) => { const el = $(id); el.textContent = arr.join(' '); el.hidden = !arr.length; if (wrap) $(wrap).classList.toggle('bad', !!arr.length); };
  put('#errW', parseErr.W ? [T('F_NUM')] : by('W'), '#wrapW');
  put('#errH', parseErr.H ? [T('F_NUM')] : by('H'), '#wrapH');
  put('#errt', by('t'));
  const be = [].concat(by('baseW'), by('baseD'), by('baseH'), (parseErr.baseW || parseErr.baseD || parseErr.baseH) ? [T('F_NUM')] : []);
  put('#errbase', be);
  ['baseW', 'baseD', 'baseH'].forEach(f => $('#wrap' + f).classList.toggle('bad', !!parseErr[f] || by(f).length > 0));
  put('#errqty', parseErr.qty ? [T('F_QTY')] : [], '#wrapqty');
}
function renderFlags() {
  const list = allIssues();
  for (let n = 1; n <= 5; n++) {
    const f = document.querySelector(`[data-flag="${n}"]`); if (!f) continue;
    const mine = list.filter(i => i.step === n);
    const lv = mine.some(i => i.lv === 'error') ? 'err' : mine.length ? 'warn' : '';
    f.hidden = !lv; f.className = 'flag ' + lv;
  }
}
function renderTotal() { renderSizing(); }
function renderFit() {
  const m = model.msgs.filter(x => x.field === 'text' || x.field === 'logo');
  const box = $('#fitBox');
  if (!m.length) { box.innerHTML = `<div class="notice ok">${esc(T('fitOk'))}</div>`; return; }
  box.innerHTML = `<ul class="msglist">${m.map(x => `<li class="${x.lv}">${esc(msgText(x))}</li>`).join('')}</ul>`;
}
function textLines() { return model.art.items.map(i => i.text); }
function renderSummary() {
  const M = model, rows = [
    [T('sum_shape'), T('shape_' + M.shape)],
    [T('sum_plaque'), `${toDisp(M.vbb.x1 - M.vbb.x0)} × ${toDisp(M.H)} ${unitLbl()}`],
    [T('sum_total'), lenTxt(M.Ht)],
    [T('sum_size'), T('size_' + activePreset())],
    [T('sum_thick'), thickTxt(M.t)],
    [T('sum_base'), M.base ? `${T('bt_' + M.type)}, ${T('bm_' + M.base.material)}, ${toDisp(M.base.W)} × ${toDisp(M.base.D)} × ${toDisp(M.base.H)} ${unitLbl()}` : T('bt_none')],
    [T('sum_finish'), `${T('m_' + M.finish.method)}, ${T('side_' + M.finish.side)}`],
    [T('sum_logo'), P.logo ? P.logo.name : T('none')]
  ];
  const lines = textLines();
  $('#summary').innerHTML = rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('') +
    `<dt>${esc(T('sum_text'))}</dt><dd>${lines.length ? lines.map(l => `<div dir="auto">${esc(l)}</div>`).join('') : esc(T('none'))}</dd>`;
}

/* ---------------- approval + downloads ---------------- */
let lastApproveSig = '';
function renderApprove(force) {
  if (!model) return;
  const valid = approvedValid();
  const errs = model.errors, warns = model.warnings, bad = Object.keys(parseErr).length > 0;
  const sig = [UI.lang, valid, approval && approval.stale, errs.map(msgText).join('|'), warns.map(msgText).join('|'), bad, model.Ht, UI.units, DLMODE, checks.spell, checks.size, checks.warn, checks.manufacturing, !!sb, account.loading, account.session ? account.session.user.id : '', account.profile ? account.profile.status : '', account.ipBlocked].join('#');
  if (!force && sig === lastApproveSig) return;
  lastApproveSig = sig;
  const area = $('#approveArea');
  if (valid) {
    const zipNote = DLMODE === 'claude';
    const seal = `<div class="seal"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 17.5l4.5 4.5L24 12.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><div><strong>${esc(T('approvedH'))}</strong><span class="small">${esc(T('approvedMeta', { ref: approval.ref, at: fmtDateUi(approval.at) }))}</span></div></div>`;
    const edit = `<div><button type="button" class="btn quiet" id="editBtn">${esc(T('editBtn'))}</button></div>`;
    let gate = '';
    if (!sb) gate = `<div class="notice warn">${esc(T('notConfigured'))}</div>`;
    else if (account.loading) gate = '<p class="small" aria-busy="true">…</p>';
    else if (!account.session) gate = `<div class="notice">${esc(T('signInToDownload'))}</div><button type="button" class="btn primary dl-main gbtn" data-signin="1">${G_LOGO}<span>${esc(T('signIn'))}</span></button><p class="small">${esc(T('legalNote'))} <a href="terms.html">${esc(T('legalTerms'))}</a>. <a href="privacy.html">${esc(T('legalPrivacy'))}</a></p>`;
    else if (account.profile && account.profile.status !== 'active') gate = `<div class="notice err">${esc(T('suspendedNotice'))}</div>`;
    if (gate) { area.innerHTML = seal + `<h3>${esc(T('dlH'))}</h3>` + gate + edit; return; }
    const item = (k, label) => `<button type="button" class="btn" data-dl="${k}">${esc(label)}${zipNote && (k === 'stl' || k === 'dxf') ? ` <small>(${esc(T('inZip'))})</small>` : ''}</button>`;
    area.innerHTML = `<div class="seal"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 17.5l4.5 4.5L24 12.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><div><strong>${esc(T('approvedH'))}</strong><span class="small">${esc(T('approvedMeta', { ref: approval.ref, at: fmtDateUi(approval.at) }))}</span></div></div>
      ${DLMODE === 'none' ? `<div class="notice warn">${esc(T('dlUnavailable'))}</div>` : ''}
      <p class="notice">${esc(T('manufacturingNotice'))}</p>
      <h3>${esc(T('dlH'))}</h3>
      <button type="button" class="btn primary dl-main" data-dl="zip" ${DLMODE === 'none' ? 'disabled' : ''}>${esc(T('dlPkg'))}</button>
      <p class="small">${esc(T('dlPkgD'))}</p>
      <div class="dl-list">${item('pdf', T('dl_pdf'))}${item('stl', T('dl_stl'))}${item('dxf', T('dl_dxf'))}${item('ins', T('dl_ins'))}${P.logo ? item('logo', T('dl_logo')) : ''}${item('png', T('dl_png'))}${item('json', T('dl_json'))}</div>
      ${account.ipBlocked ? `<div class="notice err" role="alert">${esc(T('ipBlocked'))}</div>` : ''}
      <p class="small">${esc(T('serverFilesNote', { email: account.session.user.email || '' }))}</p>
      ${zipNote ? `<p class="small">${esc(T('dlNoteZip'))}</p>` : ''}
      ${edit}`;
    return;
  }
  let h = `<div class="notice warn">${esc(T('manufacturingNotice'))} <a href="terms.html#manufacturing" target="_blank" rel="noopener">${esc(T('legalTerms'))}</a></div><label class="check"><input type="checkbox" data-chk="manufacturing" ${checks.manufacturing ? 'checked' : ''}><span>${esc(T('chkManufacturing'))}</span></label>`;
  if (approval && approval.stale) h += `<div class="notice warn">${esc(T('changed'))}</div>`;
  if (errs.length || bad) h += `<div class="notice err">${esc(T('blocked'))}</div><ul class="msglist">${errs.map(m => `<li class="error">${esc(msgText(m))}</li>`).join('')}${bad ? `<li class="error">${esc(T(parseErr.qty ? 'F_QTY' : 'F_NUM'))}</li>` : ''}</ul>`;
  if (warns.length) h += `<ul class="msglist">${warns.map(m => `<li class="warn">${esc(msgText(m))}</li>`).join('')}</ul>`;
  h += `<label class="check"><input type="checkbox" data-chk="spell" ${checks.spell ? 'checked' : ''}><span>${esc(T('chkSpell'))}</span></label>`;
  h += `<label class="check"><input type="checkbox" data-chk="size" ${checks.size ? 'checked' : ''}><span>${esc(T('chkSize', { total: lenTxt(model.Ht) }))}</span></label>`;
  if (warns.length) h += `<label class="check"><input type="checkbox" data-chk="warn" ${checks.warn ? 'checked' : ''}><span>${esc(T('chkWarn'))}</span></label>`;
  const can = !errs.length && !bad && checks.manufacturing && checks.spell && checks.size && (!warns.length || checks.warn);
  h += `<button type="button" class="btn primary dl-main" id="approveBtn" ${can ? '' : 'disabled'}>${esc(T('approveBtn'))}</button>`;
  area.innerHTML = h;
}
function approve() {
  if (!model || model.errors.length || Object.keys(parseErr).length || !checks.manufacturing || !checks.spell || !checks.size || (model.warnings.length && !checks.warn)) return;
  const h = designHash();
  approval = { noticeVersion: '2026-10-15', hash: h, ref: 'AW-' + h, at: new Date().toISOString() };
  persist(); lastApproveSig = ''; renderApprove(true);
  if (UI.view === 'drawing') renderDrawing();
  toast(T('approvedToast'));
}
const refNow = () => approvedValid() ? approval.ref : 'AW-' + designHash();
function drawingInfo() {
  const pending = [...new Set(ALL_RULES.filter(k => !CONF[k]).map(k => RULE_SHORT[k]))];
  return { ref: refNow(), approvedAt: approvedValid() ? fmtDateEn(approval.at) : null, date: fmtDateEn(new Date()), shapeName: STR.en['shape_' + model.shape], pendingRules: pending, logoPng };
}
function renderDrawing() {
  const S = Core.drawing(model, P, drawingInfo());
  $('#sheet').innerHTML = Core.drawingToSVG(S, 'Helvetica, Arial, sans-serif');
}
// artwork raster (also used as the 3D overlay texture)
function artCanvas(pxPerMm, ink, mirror, logoSrc) {
  const M = model, bb = M.vbb, Wd = bb.x1 - bb.x0, Hd = M.H;
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(Wd * pxPerMm)); c.height = Math.max(1, Math.round(Hd * pxPerMm));
  const g = c.getContext('2d');
  if (mirror) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.scale(c.width / Wd, c.height / Hd);
  const X = x => x - bb.x0, Y = y => Hd - y;
  g.fillStyle = ink;
  for (const it of M.art.items) g.fill(new Path2D(Core.svgPathD(it.cmds, X, Y)), 'nonzero');
  if (M.art.logo && logoSrc) { const lg = M.art.logo; g.drawImage(logoSrc, X(lg.x), Y(lg.y + lg.h), lg.w, lg.h); }
  return c;
}
/* ---------------- accounts (Supabase Auth) + server-side exports ---------------- */
const CFG = window.AWARD_CONFIG || {};
// Safety net: a secret/service key must never be published. If one is pasted into js/config.js, refuse to use it.
const KEY_IS_SECRET = (() => { const k = String(CFG.supabasePublishableKey || ''); if (/^sb_secret_/i.test(k)) return true;
  try { return JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch (e) { return false; } })();
if (KEY_IS_SECRET) console.error('Jaiza Studios: js/config.js contains a SECRET key. Remove it, rotate it in Supabase, and use the publishable key.');
const CONFIGURED = !KEY_IS_SECRET && !!(window.supabase && CFG.supabaseUrl && CFG.supabasePublishableKey && !/YOUR-PROJECT|REPLACE/i.test(CFG.supabaseUrl + CFG.supabasePublishableKey));
const sb = CONFIGURED ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabasePublishableKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'aw-auth' } }) : null;
const account = { session: null, profile: null, plans: {}, isAdmin: false, loading: CONFIGURED, ipBlocked: false };
let busy = false, lastAccountKey = '';
function authUrlError() {
  const u = new URL(location.href), h = new URLSearchParams(u.hash.replace(/^#/, ''));
  return u.searchParams.get('error_description') || h.get('error_description') || '';
}
function cleanAuthUrl() {
  const u = new URL(location.href); let changed = false;
  for (const k of ['code', 'error', 'error_code', 'error_description', 'state']) if (u.searchParams.has(k)) { u.searchParams.delete(k); changed = true; }
  if (/access_token|error/.test(u.hash)) { u.hash = ''; changed = true; }
  if (changed) history.replaceState(null, '', u.pathname + u.search + u.hash);
}
async function loadAccount() {
  if (!sb) { account.loading = false; renderAccount(); return; }
  const { data } = await sb.auth.getSession();
  const session = data && data.session;
  account.session = session || null; account.profile = null; account.isAdmin = false;
  if (session) {
    const [p, pl, adm] = await Promise.all([
      sb.from('profiles').select('id, email, full_name, avatar_url, status, plan_id, export_count').eq('id', session.user.id).maybeSingle(),
      sb.from('plans').select('id, name'),
      sb.rpc('current_user_is_admin')]);
    account.profile = p.data || null; account.isAdmin = adm.data === true;
    (pl.data || []).forEach(x => { account.plans[x.id] = x.name; });
  }
  account.loading = false;
  renderAccount(); lastApproveSig = ''; renderApprove(true);
}
async function loadRules() {
  if (!sb) return;
  const { data, error } = await sb.from('app_settings').select('value').eq('key', 'manufacturing_rules').maybeSingle();
  if (error || !data || !data.value) return;
  RULES = Core.normalizeRules(data.value.rules || {}); CONF = data.value.confirmed || {};
  if (!RULES.thicknesses.includes(P.t)) P.t = RULES.thicknesses.reduce((a, b) => Math.abs(b - P.t) < Math.abs(a - P.t) ? b : a);
  presetCache.clear(); renderStatic(); schedule();
  if ($('#rulesDlg').open) renderRules();
}
function signIn() {
  if (!sb) { toast(T('notConfigured')); return; }
  sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
    .then(({ error }) => { if (error) toast(T('signInFailed', { msg: error.message })); });
}
async function signOut() {
  if (sb) { try { await sb.auth.signOut(); } catch (e) { /* local session is cleared below anyway */ } }
  account.session = null; account.profile = null; account.isAdmin = false;
  renderAccount(); lastApproveSig = ''; renderApprove(true);
}
const G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
function renderAccount() {
  const box = $('#account'); if (!box) return;
  let h = '';
  if (!sb) h = '';
  else if (account.loading) h = '<span class="acct-wait" aria-busy="true">…</span>';
  else if (!account.session) h = `<button type="button" class="btn small gbtn" data-signin="1">${G_LOGO}<span>${esc(T('signIn'))}</span></button>`;
  else {
    const pr = account.profile || {}, name = pr.full_name || account.session.user.email || '';
    const plan = account.plans[pr.plan_id] || pr.plan_id || '';
    const susp = pr.status === 'suspended';
    h = `<span class="who"><span class="avatar" aria-hidden="true">${esc((name.trim()[0] || '?').toUpperCase())}</span><span class="who-txt"><b>${esc(name)}</b><small>${susp ? `<span class="badge-susp">${esc(T('suspendedBadge'))}</span>` : esc(T('planLabel', { name: plan }))}${pr.export_count != null ? ' · ' + esc(T('exportsLabel', { n: pr.export_count })) : ''}</small></span></span>`
      + (account.isAdmin ? `<a class="btn quiet small" href="admin.html">${esc(T('adminLink'))}</a>` : '')
      + `<button type="button" class="btn quiet small" data-signout="1">${esc(T('signOut'))}</button>`;
  }
  const key = h + UI.lang;
  if (key !== lastAccountKey) { box.innerHTML = h; lastAccountKey = key; }
}
async function serverExport(kind, extra) {
  const { data } = await sb.auth.getSession();
  const session = data && data.session;
  if (!session) throw { status: 401, code: 'not_signed_in' };
  let r;
  try {
    r = await fetch(CFG.supabaseUrl + '/functions/v1/export', { method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.supabasePublishableKey, Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify(Object.assign({ design: P, kind }, extra || {})) });
  } catch (e) { throw { code: 'network' }; }
  if (!r.ok) { let b = {}; try { b = await r.json(); } catch (e) { /* non-JSON error */ } throw { status: r.status, code: b.error || ('http_' + r.status), details: b.details }; }
  const bytes = new Uint8Array(await r.arrayBuffer());
  const name = r.headers.get('x-export-file') || (/filename="([^"]+)"/.exec(r.headers.get('content-disposition') || '') || [])[1] || ('award-' + kind);
  const cnt = r.headers.get('x-export-count'); if (cnt && account.profile) account.profile.export_count = +cnt;
  return { name, bytes, ref: r.headers.get('x-export-reference') };
}
function exportError(e) {
  if (e.status === 401) { toast(T('sessionExpired')); signOut(); return; }
  if (e.code === 'suspended') { if (account.profile) account.profile.status = 'suspended'; renderAccount(); lastApproveSig = ''; renderApprove(true); toast(T('suspendedNotice')); return; }
  if (e.code === 'ip_banned') { account.ipBlocked = true; lastApproveSig = ''; renderApprove(true); toast(T('ipBlocked')); return; }
  if (e.code === 'ip_unknown') { toast(T('ipUnknown')); return; }
  if (e.code === 'limit_reached') { toast(T('limitReached')); return; }
  if (e.code === 'invalid_design') { toast(T('serverRejected', { msg: (e.details || []).map(d => msgText({ lv: 'error', code: d.code, vals: d.vals || {} })).join(' ') })); return; }
  if (e.code === 'too_large' || e.status === 413) { toast(T('tooLarge')); return; }
  if (e.code === 'network') { toast(T('networkError')); return; }
  toast(T('dlFail', { name: '', msg: e.code || 'error' }));
}
function setBusy(on) { document.querySelectorAll('[data-dl]').forEach(b => { b.disabled = on; }); }
async function download(kind) {
  if (!approvedValid()) return;
  if (!sb) { toast(T('notConfigured')); return; }
  if (!account.session) { toast(T('signInToDownload')); return; }
  if (account.profile && account.profile.status !== 'active') { toast(T('suspendedNotice')); return; }
  if (busy) return;
  busy = true; setBusy(true);
  try {
    toast(T('preparingServer'));
    if (kind === 'zip') {
      // Two server requests keep each one well inside the backend's CPU limit; both files come from the server.
      const z = await serverExport('zip');
      let bytes = z.bytes, pngOk = true;
      try {
        const p = await serverExport('png', { bundle: true });
        const zip = await window.JSZip.loadAsync(z.bytes); zip.file(p.name, p.bytes);
        bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
      } catch (e) { if (e.status === 401 || e.code === 'suspended' || e.code === 'ip_banned' || e.code === 'ip_unknown') throw e; pngOk = false; }
      await saveFile(z.name, new Blob([bytes], { type: 'application/zip' }));
      if (!pngOk) toast(T('savedNoPng', { name: z.name }));
    } else {
      const f = await serverExport(kind);
      if ((kind === 'stl' || kind === 'dxf') && DLMODE === 'claude') {
        const zip = new window.JSZip(); zip.file(f.name, f.bytes);
        await saveFile(f.name + '.zip', new Blob([await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })], { type: 'application/zip' }));
      } else await saveFile(f.name, new Blob([f.bytes]));
    }
    if (account.ipBlocked) { account.ipBlocked = false; lastApproveSig = ''; renderApprove(true); }
    renderAccount();
  } catch (e) { exportError(e); }
  finally { busy = false; setBusy(false); }
}
async function adminSaveRules() {
  const { data } = await sb.auth.getSession(); const session = data && data.session;
  if (!session || !account.isAdmin) return;
  try {
    const r = await fetch(CFG.supabaseUrl + '/functions/v1/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.supabasePublishableKey, Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ action: 'set_rules', rules: RULES, confirmed: CONF }) });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(b.error || r.status);
    RULES = Core.normalizeRules(b.rules); CONF = b.confirmed || {}; renderRules(); renderStatic(); schedule(); toast(T('rulesSaved'));
  } catch (e) { toast(T('rulesSaveFailed', { msg: e.message })); }
}

/* ---------------- 3D view (same triangles as the STL) ---------------- */
const V3 = (() => {
  let renderer, scene, camera, root, ready = false, failed = false, fitKey = '';
  const st = { theta: -0.6, phi: 1.2, dist: 600, r: 200, tx: 0, ty: 100, tz: 0 };
  const api = { dirty: true };
  function init() {
    if (ready || failed) return ready;
    try {
      if (!window.THREE) throw new Error('three');
      const canvas = $('#c3d');
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, 1, 1, 50000);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x18303f, 0.95));
      const d1 = new THREE.DirectionalLight(0xffffff, 0.85); d1.position.set(300, 600, 700); scene.add(d1);
      const d2 = new THREE.DirectionalLight(0x9fe3e6, 0.55); d2.position.set(-500, 200, -400); scene.add(d2);
      root = new THREE.Group(); scene.add(root);
      controls(canvas);
      if (window.ResizeObserver) new ResizeObserver(() => render()).observe(canvas);
      ready = true;
    } catch (e) {
      failed = true;
      $('#view3d').innerHTML = `<p class="overlay-hint" style="position:static">${esc(T('no3d'))}</p>`;
    }
    return ready;
  }
  function controls(c) {
    const pts = new Map(); let pinch = 0;
    c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    c.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) { st.theta -= dx * 0.008; st.phi = Math.min(Math.PI - 0.12, Math.max(0.12, st.phi - dy * 0.008)); }
      else if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) st.dist = clampD(st.dist * pinch / d); pinch = d; }
      render();
    });
    const up = e => { pts.delete(e.pointerId); pinch = 0; };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', e => { e.preventDefault(); st.dist = clampD(st.dist * Math.exp(e.deltaY * 0.0012)); render(); }, { passive: false });
    c.addEventListener('dblclick', () => { fitKey = ''; api.update(); });
  }
  const clampD = d => Math.min(st.r * 9, Math.max(st.r * 1.1, d));
  function dispose() {
    root.children.slice().forEach(o => { root.remove(o); o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) [].concat(n.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); }); });
  }
  const geo = a => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.computeVertexNormals(); return g; };
  api.update = function () {
    if (!init()) return;
    api.dirty = false;
    dispose();
    const M = model, ms = Core.meshes(M);
    const stl = new THREE.Group(); stl.rotation.x = -Math.PI / 2; root.add(stl);
    const pg = geo(ms.plaque);
    const pm = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: 0xd6f4f7, transparent: true, opacity: 0.3, roughness: 0.06, metalness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    pm.renderOrder = 2; stl.add(pm);
    stl.add(new THREE.LineSegments(new THREE.EdgesGeometry(pg, 25), new THREE.LineBasicMaterial({ color: 0x9fe3e6 })));
    if (ms.base) {
      const bg = geo(ms.base), mat = M.base.material;
      const opts = { black: { color: 0x1b2028, roughness: 0.22, metalness: 0.15 }, clear: { color: 0xd6f4f7, roughness: 0.06, transparent: true, opacity: 0.4, depthWrite: false }, frosted: { color: 0xeef3f5, roughness: 0.7, transparent: true, opacity: 0.9 }, wood: { color: 0x8b5a32, roughness: 0.75 } }[mat];
      const bm = new THREE.Mesh(bg, new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, opts))); bm.renderOrder = 1; stl.add(bm);
      stl.add(new THREE.LineSegments(new THREE.EdgesGeometry(bg, 25), new THREE.LineBasicMaterial({ color: mat === 'black' ? 0x46505f : 0x9fe3e6 })));
    }
    // artwork overlay (not part of the STL)
    if (M.art.items.length || M.art.logo) {
      const Wd = M.vbb.x1 - M.vbb.x0, ppm = Math.min(8, 2048 / Math.max(Wd, M.H));
      const ink = M.finish.method === 'laser' ? 'rgba(242,250,255,0.95)' : M.finish.color;
      const c = artCanvas(ppm, ink, false, M.finish.method === 'laser' ? logoFrost : (logoPng ? logoImg : null));
      const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(Wd, M.H), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      const off = M.t / 2 + 0.15;
      decal.position.set((M.vbb.x0 + M.vbb.x1) / 2, M.H / 2, M.finish.side === 'back' ? -off : off);
      decal.renderOrder = 3; root.add(decal);
    }
    const key = `${M.W}|${M.H}|${M.base ? M.base.W + 'x' + M.base.H : '-'}`;
    if (key !== fitKey) {
      fitKey = key;
      const box = new THREE.Box3().setFromObject(root), cen = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      st.r = size.length() / 2; st.tx = cen.x; st.ty = cen.y; st.tz = cen.z;
      st.dist = st.r / Math.sin((camera.fov * Math.PI / 180) / 2) * 1.02; st.theta = -0.6; st.phi = 1.22;
    }
    render();
  };
  function render() {
    if (!ready) return;
    const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * renderer.getPixelRatio()) || c.height !== Math.round(h * renderer.getPixelRatio())) renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    camera.position.set(st.tx + st.dist * Math.sin(st.phi) * Math.sin(st.theta), st.ty + st.dist * Math.cos(st.phi), st.tz + st.dist * Math.sin(st.phi) * Math.cos(st.theta));
    camera.lookAt(st.tx, st.ty, st.tz);
    renderer.render(scene, camera);
  }
  api.render = render;
  return api;
})();

/* ---------------- rules dialog ---------------- */
function renderRules() {
  const unit = k => k === 'tipFactor' ? '×' : T('mm');
  $('#rulesBody').innerHTML = Core.RULE_GROUPS.map(([g, keys]) => `<h3>${esc(T('rg_' + g))}</h3>` + keys.map(k => {
    const v = Array.isArray(RULES[k]) ? RULES[k].join(', ') : RULES[k];
    const ro = account.isAdmin ? '' : ' disabled';
    return `<div class="rule"><label for="rule-${k}">${esc(T('r_' + k))}</label><div class="inwrap"><input id="rule-${k}" data-rule="${k}" value="${esc(v)}" inputmode="decimal"${ro}><span class="unit">${esc(unit(k))}</span></div><label class="cf"><input type="checkbox" data-conf="${k}" ${CONF[k] ? 'checked' : ''}${ro}>${esc(T('confirmed'))}</label></div>`;
  }).join('')).join('');
  $('#rulesNote').textContent = account.isAdmin ? '' : T('rulesReadOnly'); $('#rulesNote').hidden = account.isAdmin;
  $('#rulesSave').hidden = !account.isAdmin; $('#rulesReset').hidden = !account.isAdmin;
}
function setRule(k, raw) {
  if (k === 'thicknesses') {
    const list = String(raw).split(/[,،;\s]+/).map(parseNum).filter(v => v > 0 && v <= 100);
    if (!list.length) return false;
    RULES.thicknesses = [...new Set(list)].sort((a, b) => a - b);
    if (!RULES.thicknesses.includes(P.t)) P.t = RULES.thicknesses.reduce((a, b) => Math.abs(b - P.t) < Math.abs(a - P.t) ? b : a);
    return true;
  }
  const v = parseNum(raw);
  if (!(v >= 0) || v > 2000) return false;
  const nv = Object.assign({}, RULES, { [k]: v });
  if (nv.plaqueWMin >= nv.plaqueWMax || nv.plaqueHMin >= nv.plaqueHMax || nv.baseHMin >= nv.baseHMax || nv.curveTol <= 0 || nv.curveTol > 1 || nv.tipFactor > 1) return false;
  RULES[k] = v; return true;
}

/* ---------------- events ---------------- */
function goStep(n) {
  UI.step = Math.min(5, Math.max(1, n)); if (!UI.seen.includes(UI.step)) UI.seen.push(UI.step);
  renderStatic(); renderFlags(); lastApproveSig = ''; renderApprove(true);
  const tk = document.querySelector('.ticket'); if (tk.scrollTop) tk.scrollTop = 0;
  if (window.innerWidth <= 900) { const st = $('#steps'); const y = st.getBoundingClientRect().top + window.scrollY - st.offsetTop; if (window.scrollY > y) window.scrollTo({ top: y }); }
  persist();
}
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-goto]'); if (!t) return;
  const d = t.dataset;
  if (d.goto) { goStep(+d.goto); return; }
  if (d.shape) { P.shape = d.shape; renderStatic(); schedule(); return; }
  if (d.size) {
    if (d.size === 'custom') { P.sizePreset = 'custom'; schedule(); $('#slH').focus(); return; }
    const sz = Core.presetSize(d.size, RULES); if (!sz) return;
    P.W = sz.W; P.H = sz.H; P.sizePreset = d.size; P.base.auto = true;
    ['W', 'H', 'baseW', 'baseD', 'baseH'].forEach(k => delete parseErr[k]);
    renderStatic(); fillFields(); schedule(); return;
  }
  if (d.thick) { P.t = +d.thick; renderStatic(); schedule(); return; }
  if (d.bt) {
    P.base.type = d.bt;
    if (d.bt === 'none' && P.t < RULES.freeMinT) { const t2 = RULES.thicknesses.find(x => x >= RULES.freeMinT); if (t2) { P.t = t2; toast(T('thickBumped', { t: thickTxt(t2) })); } }
    renderStatic(); schedule(); return;
  }
  if (d.bm) { P.base.material = d.bm; renderStatic(); schedule(); return; }
  if (d.method) { P.finish.method = d.method; renderStatic(); schedule(); return; }
  if (d.color) { P.finish.color = d.color; renderStatic(); schedule(); return; }
  if (d.side) { P.finish.side = d.side; renderStatic(); schedule(); return; }
  if (d.u) { UI.units = d.u; Object.keys(parseErr).forEach(k => { if (k !== 'qty') delete parseErr[k]; }); renderStatic(); fillFields(); lastApproveSig = ''; schedule(); return; }
  if (d.view) { UI.view = d.view; renderStatic(); if (d.view === '3d') V3.update(); if (d.view === 'drawing') renderDrawing(); persist(); return; }
  if (d.dl) { download(d.dl); return; }
  if (d.signin) { signIn(); return; }
  if (d.signout) { signOut(); return; }
  switch (t.id) {
    case 'prevBtn': goStep(UI.step - 1); break;
    case 'nextBtn': goStep(UI.step + 1); break;
    case 'btnLang': UI.lang = UI.lang === 'ar' ? 'en' : 'ar'; applyLang(); persist(); break;
    case 'exAr': case 'exEn': P.text = Object.assign({}, Core.EXAMPLES[t.id === 'exAr' ? 'ar' : 'en']); fillFields(); schedule(); break;
    case 'exClear': P.text = { heading: '', name: '', body: '', footer: '' }; fillFields(); schedule(); break;
    case 'logoPick': case 'logoReplace': $('#logoFile').click(); break;
    case 'logoRemove': P.logo = null; logoImg = logoPng = logoFrost = null; logoHash = ''; refreshLogoUI(); schedule(); break;
    case 'approveBtn': approve(); break;
    case 'editBtn': approval = null; lastApproveSig = ''; persist(); renderApprove(true); if (UI.view === 'drawing') renderDrawing(); break;
    case 'zoomBtn': zoomed = !zoomed; $('#sheet').classList.toggle('zoom', zoomed); t.textContent = zoomed ? T('fit') : T('zoom'); break;
    case 'btnRules': renderRules(); $('#rulesDlg').showModal(); break;
    case 'rulesClose': $('#rulesDlg').close(); break;
    case 'rulesSave': adminSaveRules(); break;
    case 'rulesReset': if (!account.isAdmin) break; RULES = Core.normalizeRules({}); CONF = {}; if (!RULES.thicknesses.includes(P.t)) P.t = 12; renderRules(); renderStatic(); schedule(); break;
    case 'resetBtn':
      if (t.dataset.armed) {
        P = Core.defaultParams(); approval = null; logoImg = logoPng = logoFrost = null; logoHash = '';
        Object.keys(parseErr).forEach(k => delete parseErr[k]); checks.spell = checks.size = checks.warn = false;
        delete t.dataset.armed; t.textContent = T('startOver'); refreshLogoUI(); renderStatic(); fillFields(); lastApproveSig = ''; goStep(1); schedule();
      } else { t.dataset.armed = '1'; t.textContent = T('startOverQ'); setTimeout(() => { if (t.dataset.armed) { delete t.dataset.armed; t.textContent = T('startOver'); } }, 4000); }
      break;
  }
});
const NUM = { W: v => { P.W = v; }, H: v => { P.H = v; }, baseW: v => { P.base.W = v; }, baseD: v => { P.base.D = v; }, baseH: v => { P.base.H = v; } };
const GET = { W: () => P.W, H: () => P.H, baseW: () => P.base.W, baseD: () => P.base.D, baseH: () => P.base.H };
document.addEventListener('input', e => {
  const el = e.target, d = el.dataset;
  if (d.slide) {
    P[d.slide] = +el.value; P.sizePreset = 'custom'; delete parseErr[d.slide];
    $(d.slide === 'H' ? '#slHOut' : '#slWOut').textContent = lenTxt(+el.value); el.setAttribute('aria-valuetext', lenTxt(+el.value));
    fillFields(); schedule(); return;
  }
  if (d.num) {
    if (d.num === 'W' || d.num === 'H') P.sizePreset = 'custom';
    const v = parseNum(el.value);
    if (isNaN(v)) parseErr[d.num] = true; else { delete parseErr[d.num]; NUM[d.num](UI.units === 'cm' ? Math.round(v * 100) / 10 : v); }
    schedule(); return;
  }
  if (d.text) { P.text[d.text] = el.value; schedule(); return; }
  if (d.meta) { P.meta[d.meta] = el.value; schedule(); return; }
  if (el.id === 'mQty') { const v = parseNum(el.value); if (Number.isInteger(v) && v >= 1 && v <= 999) { delete parseErr.qty; P.meta.qty = v; } else parseErr.qty = true; schedule(); return; }
  if (el.id === 'tScale') { P.textScale = +el.value / 100; $('#tScaleOut').textContent = el.value + '%'; schedule(); return; }
  if (el.id === 'lScale') { P.logoScale = +el.value / 100; $('#lScaleOut').textContent = el.value + '%'; schedule(); return; }
});
document.addEventListener('change', e => {
  const el = e.target, d = el.dataset;
  if (el.id === 'autoBase') {
    if (!el.checked && model && model.base) { P.base.W = model.base.W; P.base.D = model.base.D; P.base.H = model.base.H; }
    P.base.auto = el.checked; ['baseW', 'baseD', 'baseH'].forEach(k => delete parseErr[k]); fillFields(); schedule(); return;
  }
  if (el.id === 'phoneToggle') { UI.phone = el.checked; renderFront(); persist(); return; }
  if (el.id === 'logoFile') { const f = el.files && el.files[0]; if (f) takeLogo(f); el.value = ''; return; }
  if (d.chk) { checks[d.chk] = el.checked; const btn = $('#approveBtn'); if (btn) btn.disabled = !(model && !model.errors.length && !Object.keys(parseErr).length && checks.manufacturing && checks.spell && checks.size && (!model.warnings.length || checks.warn)); lastApproveSig = ''; return; }
  if ((d.rule || d.conf) && !account.isAdmin) { renderRules(); return; }
  if (d.rule) { if (!setRule(d.rule, el.value)) { toast(T('ruleBad')); renderRules(); return; } renderStatic(); schedule(); persist(); return; }
  if (d.conf) { CONF[d.conf] = el.checked; renderStatic(); persist(); lastApproveSig = ''; if (UI.view === 'drawing') renderDrawing(); return; }
});
document.addEventListener('focusout', e => { const d = e.target.dataset; if (d && d.num && !parseErr[d.num]) e.target.value = toDisp(GET[d.num]()); });
document.addEventListener('keydown', e => {
  const d = e.target.dataset; if (!d || !d.num || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || e.target.disabled) return;
  e.preventDefault();
  const step = (UI.units === 'cm' ? 5 : 5) * (e.shiftKey ? 2 : 1), cur = GET[d.num]();
  const nv = Math.max(0, Math.round((cur + (e.key === 'ArrowUp' ? step : -step)) / 5) * 5);
  NUM[d.num](nv); delete parseErr[d.num]; if (d.num === 'W' || d.num === 'H') P.sizePreset = 'custom'; e.target.value = toDisp(nv); schedule();
});
const tk = document.querySelector('.ticket');
tk.addEventListener('dragover', e => { if (UI.step === 3) e.preventDefault(); });
tk.addEventListener('drop', e => { if (UI.step !== 3) return; e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) takeLogo(f); });

/* ---------------- start ---------------- */
if (P.logo && P.logo.dataUrl) {
  logoHash = Core.hash(P.logo.dataUrl);
  loadImg(P.logo.dataUrl).then(img => { logoImg = img; prepareLogo(); refreshLogoUI(); schedule(); }).catch(() => { P.logo = null; refreshLogoUI(); schedule(); });
}
if (!UI.seen.includes(UI.step)) UI.seen.push(UI.step);
applyLang();
renderAccount();
if (sb) {
  const authErr = authUrlError();
  if (authErr) toast(/banned/i.test(authErr) ? T('suspendedSignin') : T('signInFailed', { msg: authErr }));
  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') setTimeout(() => { cleanAuthUrl(); loadAccount(); }, 0);
  });
  loadAccount().then(cleanAuthUrl);
  loadRules();
}
})();
