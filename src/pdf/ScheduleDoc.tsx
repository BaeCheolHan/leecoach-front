import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FormValues } from '../ui/schema';
import type { AnnuityResult } from '../domain/annuity';
import { DISCOUNT_RATE } from '../config';

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

const s = StyleSheet.create({
  page: { fontFamily: 'NanumMyeongjo', fontSize: 10, paddingVertical: 48, paddingHorizontal: 48 },
  title: { fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 },
  metaTable: { marginBottom: 14, borderWidth: 0.7, borderColor: '#333' },
  metaRow: { flexDirection: 'row', borderBottomWidth: 0.7, borderColor: '#333' },
  metaCell: { flex: 1, flexDirection: 'row' },
  metaKey: { width: 92, padding: 4, fontWeight: 'bold', backgroundColor: '#f2f2f2' },
  metaVal: { flex: 1, padding: 4 },
  table: { borderWidth: 0.7, borderColor: '#333', marginBottom: 12 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.7, borderColor: '#333' },
  th: { flex: 1, padding: 4, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f2f2f2' },
  td: { flex: 1, padding: 4, textAlign: 'right' },
  tdCenter: { flex: 1, padding: 4, textAlign: 'center' },
  legal: { fontSize: 8, color: '#444', marginBottom: 8 },
});

export interface ScheduleProps {
  values: FormValues;
  result: AnnuityResult;
  doneeBirthDate: string;
  isDoneeMinor: boolean;
}

export function ScheduleDoc({ values, result, doneeBirthDate, isDoneeMinor }: ScheduleProps) {
  const { donor, donee, terms } = values;
  const meta: [string, string][] = [
    ['증여자', donor.name],
    ['수증자', `${donee.name} (증여자의 ${donee.relation})`],
    ['수증자 생년월일', `${doneeBirthDate} (증여시작일 현재 ${isDoneeMinor ? '미성년자' : '성년'})`],
    ['정기금 기간', `${terms.startDate} ~ ${terms.endDate}`],
    ['지급 시기', `매월 ${terms.paymentDay}일, 매월 ${won(terms.monthlyAmount)}`],
    ['할인율', `연 ${(DISCOUNT_RATE * 100).toFixed(0)}%`],
  ];
  return (
    <Document title="유기정기금 평가명세서" language="ko">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>유기정기금 평가명세서</Text>

        <View style={s.metaTable}>
          {meta.map(([k, v]) => (
            <View key={k} style={s.metaRow}>
              <View style={s.metaCell}>
                <Text style={s.metaKey}>{k}</Text>
                <Text style={s.metaVal}>{v}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.table}>
          <View style={s.tr}>
            {['년도', '불입년도', '불입횟수(월)', '불입원금', '할인평가액'].map((h) => (
              <Text key={h} style={s.th}>{h}</Text>
            ))}
          </View>
          {result.rows.map((r) => (
            <View key={r.year} style={s.tr}>
              <Text style={s.tdCenter}>{r.year}</Text>
              <Text style={s.tdCenter}>{r.seq}</Text>
              <Text style={s.tdCenter}>{r.payments}</Text>
              <Text style={s.td}>{won(r.principal)}</Text>
              <Text style={s.td}>{won(r.discounted)}</Text>
            </View>
          ))}
          <View style={s.tr}>
            <Text style={[s.th, { textAlign: 'center' }]}>합계</Text>
            <Text style={s.tdCenter}></Text>
            <Text style={s.tdCenter}></Text>
            <Text style={[s.td, { fontWeight: 'bold' }]}>{won(result.totalPrincipal)}</Text>
            <Text style={[s.td, { fontWeight: 'bold' }]}>{won(result.totalDiscounted)}</Text>
          </View>
        </View>

        {result.capApplied && (
          <Text style={s.legal}>
            ※ 평가액 합계가 1년분 정기금액의 20배({won(result.cap)})를 초과하여 상한을 적용하였습니다
            (상속세 및 증여세법 시행령 제62조 제1호 단서).
          </Text>
        )}

      </Page>
    </Document>
  );
}
