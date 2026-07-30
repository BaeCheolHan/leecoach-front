import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FormValues } from '../ui/schema';
import type { AnnuityResult } from '../domain/annuity';
import type { DeductionJudgement } from '../domain/giftTax';
import { DISCOUNT_RATE, DISCLAIMER } from '../config';

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
  judgement: { marginBottom: 12, padding: 8, borderWidth: 0.7, borderColor: '#333' },
  legal: { fontSize: 8, color: '#444', marginBottom: 8 },
  disclaimer: { fontSize: 7.5, color: '#666' },
});

export interface ScheduleProps {
  values: FormValues;
  result: AnnuityResult;
  judgement: DeductionJudgement;
  doneeBirthDate: string;
  isDoneeMinor: boolean;
}

export function ScheduleDoc({ values, result, judgement, doneeBirthDate, isDoneeMinor }: ScheduleProps) {
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

        <View style={s.judgement}>
          <Text>
            증여재산공제 한도: {won(judgement.limit)}
            {judgement.minorApplied ? ' (미성년자·직계존속 공제)' : ''} — {' '}
            {judgement.within
              ? `한도 이내이므로 예상 증여세는 0원입니다.`
              : `한도를 ${won(judgement.excess)} 초과합니다. 세무사 검토가 필요합니다.`}
          </Text>
          <Text>
            ※ 증여재산공제는 10년간 동일인으로부터 받은 증여를 통산합니다. 이 계약 외 기증여가 있는 경우
            합산하여 판단하여야 합니다.
          </Text>
        </View>

        <Text style={s.legal}>
          근거: 상속세 및 증여세법 시행령 제62조(정기금을 받을 권리의 평가) 제1호 — 유기정기금은 잔존기간에
          각 연도에 받을 정기금액을 기준으로 [각 연도에 받을 정기금액 ÷ (1 + 이자율)^n, n은 평가기준일부터의
          경과연수]로 계산한 금액의 합계액으로 평가하며, 1년분 정기금액의 20배를 초과할 수 없다.
          이자율은 기획재정부령이 정하는 연 {(DISCOUNT_RATE * 1000).toFixed(0)}/1,000이다.
        </Text>
        <Text style={s.disclaimer}>{DISCLAIMER}</Text>
      </Page>
    </Document>
  );
}
