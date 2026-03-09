import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TaskCreatedEmailProps {
  authorName: string;
  taskTitle: string;
  taskDescription: string;
  taskUrl: string;
  projectName: string;
}

export const TaskCreatedEmail = ({
  authorName,
  taskTitle,
  taskDescription,
  taskUrl,
  projectName,
}: TaskCreatedEmailProps) => (
  <Html>
    <Head />
    <Preview>New task created in {projectName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Task Created</Heading>
        <Text style={text}>
          <strong>{authorName}</strong> created a new task in <strong>{projectName}</strong>.
        </Text>
        <Section style={section}>
          <Text style={taskTitleStyle}>{taskTitle}</Text>
          <Text style={text}>{taskDescription}</Text>
        </Section>
        <Section style={btnContainer}>
          <Link style={button} href={taskUrl}>
            View Task
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  color: "#333",
};

const section = {
  padding: "24px",
  border: "1px solid #e6e6e6",
  borderRadius: "5px",
  margin: "24px 0",
};

const taskTitleStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
  color: "#333",
};

const text = {
  fontSize: "16px",
  margin: "0 0 10px 0",
  color: "#333",
  lineHeight: "24px",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};
