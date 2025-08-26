interface InputProps {
  text: string;
  handleChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  placeHolder: string;
}

export const FormsInput = ({ text, handleChange, placeHolder }: InputProps) => {
  return (
    <>
      <input
        value={text}
        type="text"
        placeholder={placeHolder}
        onChange={handleChange}
      />
    </>
  );
};
