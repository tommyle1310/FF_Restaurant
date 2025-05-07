import "../../global.css";
import "react-native-reanimated";
import { Provider } from "react-redux";
import store from "@/src/store/store";
import RootLayout from "@/src/app/screens/RootLayout";

export default function Layout() {
  return (
    <Provider store={store}>
      <RootLayout />
    </Provider>
  );
}
