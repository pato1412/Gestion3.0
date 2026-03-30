import styled from 'styled-components';

const StyledH2 = styled.h2`
  color: #FFF;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 1rem;
`;


const SidebarTitle = ({ title }) => {
  return (
    <StyledH2>{title}</StyledH2>
  )
}

export default SidebarTitle