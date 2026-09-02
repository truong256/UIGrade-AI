import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"src"))
from uigrade_baseline import summary,validate
def row(**x):
    r={"case_id":"G1","assignment":"login","device":"360x800","teacher_score":8,"auto_score":7,"rubric_total":10,"layout_similarity":.8,"contrast_pass":True,"data_source":"synthetic"};r.update(x);return r
class TestGrade(unittest.TestCase):
    def test_valid(self):self.assertEqual(validate([row()]),[])
    def test_score_range(self):self.assertTrue(validate([row(auto_score=11)]))
    def test_mae(self):self.assertEqual(summary([row(),row(case_id="G2",teacher_score=5,auto_score=7)])["mae"],1.5)
if __name__=="__main__":unittest.main()
