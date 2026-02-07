import { currentUser } from "@clerk/nextjs/server";

const user = await currentUser();
const mail = user?.emailAddresses[0].emailAddress;

export default function Test() {
  console.log(mail);
  console.log(user?.id);
  return (
    <div>
      <h1>Test</h1>
    </div>
  );
}
