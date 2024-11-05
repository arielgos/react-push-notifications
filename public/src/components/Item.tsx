import { Timestamp } from "firebase/firestore";
import Card from "react-bootstrap/Card";
import { FC } from "react";
import { Notification } from "../models/Models";
import { getPublicUrl } from "../helpers/Firebase";
import Image from "react-bootstrap/Image";
import { Row, Col } from "react-bootstrap";

interface ItemProps {
  notification: Notification;
}

const Item: FC<ItemProps> = (props) => {
  return (
    <Col className="mt-4">
      <Card>
        <Card.Header>{props.notification.title}</Card.Header>
        <Card.Body>
          <Row>
            <Col>
              <Card.Text>
                <Image src={getPublicUrl(props.notification.file ?? "")} rounded width={"100%"} />
              </Card.Text>
            </Col>
            <Col>
              <Card.Title>{props.notification.message}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                {Timestamp.fromMillis(props.notification.time).toDate().toUTCString()}
              </Card.Subtitle>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default Item;
