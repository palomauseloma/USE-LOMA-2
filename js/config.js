window.App = window.App || {};
App.cfg = {
  supabaseUrl: 'https://qifurlvpgkswllqspkpb.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZnVybHZwZ2tzd2xscXNwa3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTE0NDYsImV4cCI6MjEwNTI2NzQ0Nn0.jcSILWdqJpljGJ0CRk499qGiAbpGR8qHMdzFFDd1VQ0',
  storageBase: 'https://qifurlvpgkswllqspkpb.supabase.co/storage/v1/object/public'
};
App.CART_KEY = 'useloma_cart_v1';
App.ORDER_STATUS = {
  pending: 'Aguardando pagamento',
  received: 'Pedido recebido',
  paid: 'Pagamento confirmado',
  preparing: 'Em preparação',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};
App.GROUP_STATUS = {
  open: 'Aberto',
  complete: 'Completo',
  closed: 'Encerrado',
  cancelled: 'Cancelado'
};
