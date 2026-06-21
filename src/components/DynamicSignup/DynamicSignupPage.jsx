import InputRenderer from "@/components/InputRenderer/InputRenderer";
import "./DynamicSignupPage.scss";

const DynamicSignupPage = ({ questions, values = {}, errors = {}, onChange }) => {
  if (!questions) return null;

  return (
    <div className="questions-container">
      <h5 className="mb-4">{questions?.question_text}</h5>

      {questions?.sub_questions.map((sub) => (
        <div key={sub.id} className="form-field">
          <label htmlFor={`field-${sub.id}`} className="label-name">
            {sub.question_text}
            <span className="required">*</span>
          </label>

          <InputRenderer
            field={sub}
            value={values[sub.id] ?? ""}
            error={errors[sub.id]}
            onChange={(value) => onChange(sub.id, value)}
          />
        </div>
      ))}
    </div>
  );
};

export default DynamicSignupPage;
