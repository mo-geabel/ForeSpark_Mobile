import { TextInput, StyleSheet } from "react-native";

export default function Input(props: any) {
  return (
    <TextInput
      {...props}
      value={props.value ?? ""} // IMPORTANT
      placeholder={props.placeholder}
      placeholderTextColor="#94a3b8" // REQUIRED
      style={styles.input}
    />
  );
}


const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
});
