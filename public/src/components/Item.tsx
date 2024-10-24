import { Timestamp } from "firebase/firestore";
import Card from "react-bootstrap/Card";
import { FC } from "react";
import { Notification } from "../models/Models";

interface ItemProps {
  notification: Notification;
}

const Item: FC<ItemProps> = (props) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>{props.notification.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{props.notification.message}</Card.Subtitle>
        <Card.Text className="justify-content-end">
          <span className="text-muted small">
            {Timestamp.fromMillis(props.notification.time).toDate().toUTCString()}
          </span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Item;
