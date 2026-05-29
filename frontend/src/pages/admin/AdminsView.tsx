import { MaterialIcon } from "../../components/MaterialIcon";

export function AdminsView({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="admin-view is-active">
      <header className="page-header"><h1>어드민 관리</h1></header>
      <div className="page-content narrow-page">
        <section className="app-card admin-add-card"><div className="card-head"><h2><MaterialIcon name="person_add" />어드민 계정 추가</h2></div><button className="dark-button" type="button" onClick={onOpen}><MaterialIcon name="add" />어드민 계정 추가하기</button></section>
        <section className="app-card data-table-card admin-table"><div className="section-toolbar"><h2><MaterialIcon name="list_alt" />현재 등록된 어드민 목록</h2><span className="count-pill">총 4명</span></div><table><thead><tr><th>아이디</th><th>이름</th><th>등록일</th><th>권한</th><th>관리</th></tr></thead><tbody>{["super_admin|관리자 A|2024-01-15|전체 권한", "ops_manager_01|관리자 B|2024-03-22|운영 권한", "safety_inspector_01|관리자 C|2024-05-10|안전 조회", "staff_admin_ops|관리자 D|2024-06-02|운영 권한"].map((row) => { const [id, name, date, role] = row.split("|"); return <tr key={id}><td><MaterialIcon name="account_circle" filled /> <strong>{id}</strong></td><td>{name}</td><td>{date}</td><td><em>{role}</em></td><td><span className="table-icon-actions"><MaterialIcon name="edit" /><MaterialIcon name="delete" /></span></td></tr>; })}</tbody></table></section>
      </div>
    </section>
  );
}
