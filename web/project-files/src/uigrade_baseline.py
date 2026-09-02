"""Validate UI grading comparisons and measure agreement with instructor scores."""
import argparse,json
from collections import defaultdict
from pathlib import Path
REQUIRED=("case_id","assignment","device","teacher_score","auto_score","rubric_total","layout_similarity","contrast_pass","data_source")
def load(path):
    rows=[]
    for n,line in enumerate(Path(path).read_text(encoding="utf-8-sig").splitlines(),1):
        if line.strip():
            try:rows.append(json.loads(line))
            except json.JSONDecodeError as e:raise ValueError(f"Dong {n}: JSON loi {e.msg}")
    return rows
def validate(rows):
    errors=[];ids=set()
    for n,r in enumerate(rows,1):
        missing=[x for x in REQUIRED if x not in r]
        if missing:errors.append(f"Dong {n}: thieu {','.join(missing)}");continue
        if r["case_id"] in ids:errors.append(f"Dong {n}: trung case_id")
        ids.add(r["case_id"])
        try:
            total=float(r["rubric_total"]);teacher=float(r["teacher_score"]);auto=float(r["auto_score"]);sim=float(r["layout_similarity"])
            if total<=0 or not 0<=teacher<=total or not 0<=auto<=total:errors.append(f"Dong {n}: diem ngoai rubric")
            if not 0<=sim<=1:errors.append(f"Dong {n}: layout_similarity ngoai 0-1")
        except (TypeError,ValueError):errors.append(f"Dong {n}: truong so khong hop le")
        if not isinstance(r["contrast_pass"],bool):errors.append(f"Dong {n}: contrast_pass phai la boolean")
    return errors
def group_metrics(rows):
    diffs=[float(r["auto_score"])-float(r["teacher_score"]) for r in rows]
    return {"n":len(rows),"mae":round(sum(abs(x) for x in diffs)/len(rows),3),"mean_bias":round(sum(diffs)/len(rows),3),"within_1_point_rate":round(sum(abs(x)<=1 for x in diffs)/len(rows),3)}
def summary(rows):
    groups=defaultdict(list)
    for r in rows:groups[r["assignment"]].append(r)
    result=group_metrics(rows);result["by_assignment"]={k:group_metrics(v) for k,v in sorted(groups.items())};result["review_cases"]=[r["case_id"] for r in rows if abs(float(r["auto_score"])-float(r["teacher_score"]))>1];return result
def main():
    ap=argparse.ArgumentParser();ap.add_argument("input");ap.add_argument("--output",default="reports/student_baseline_summary.json");a=ap.parse_args();rows=load(a.input);errors=validate(rows)
    if errors:raise SystemExit("Du lieu loi:\n- "+"\n- ".join(errors))
    result=summary(rows);out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8");print(f"n={result['n']} | MAE={result['mae']} | within1={result['within_1_point_rate']}")
if __name__=="__main__":main()
