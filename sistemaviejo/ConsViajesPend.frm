VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form ConsViajesPend 
   BackColor       =   &H80000007&
   Caption         =   "Consulta de Viajes Sin Facturar"
   ClientHeight    =   2940
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8895
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2940
   ScaleWidth      =   8895
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Parámetros Consulta"
      ForeColor       =   &H000080FF&
      Height          =   2295
      Left            =   480
      TabIndex        =   0
      Top             =   240
      Width           =   8055
      Begin VB.ComboBox Combo1 
         Height          =   315
         Left            =   2160
         TabIndex        =   3
         Text            =   "Combo1"
         Top             =   960
         Width           =   4815
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000007&
         Caption         =   "Una Empresa"
         ForeColor       =   &H000040C0&
         Height          =   315
         Index           =   1
         Left            =   600
         TabIndex        =   2
         Top             =   960
         Width           =   2175
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000007&
         Caption         =   "Todos las Empresas"
         ForeColor       =   &H000040C0&
         Height          =   315
         Index           =   0
         Left            =   600
         TabIndex        =   1
         Top             =   480
         Width           =   2175
      End
      Begin KewlButtonz.KewlButtons Consultar 
         Height          =   495
         Left            =   2640
         TabIndex        =   4
         Top             =   1560
         Width           =   2895
         _ExtentX        =   5106
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Consultar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ConsViajesPend.frx":0000
         PICN            =   "ConsViajesPend.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
   End
End
Attribute VB_Name = "ConsViajesPend"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Consultar_Click()
Dim Sql As String
If Option1(0).Value = True Then
    Sql = "Select * From LiqDetViajes Where Facturado = 'NO'"
Else
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where DescEmpresas = '" & Combo1.Text & "'")
    Sql = "Select * From LiqDetViajes Where Facturado = 'NO' And CodEmpresa = " & rsEmpresas!CodEmpresas & ""
    Set rsEmpresas = Nothing
End If
Set rsLiqDetViajes = db.OpenRecordset(Sql)
Set rsViajes_SFact = dbTemp.OpenRecordset("Viajes_SFact")
Do While Not rsViajes_SFact.EOF
    rsViajes_SFact.Delete
    rsViajes_SFact.MoveNext
Loop
With rsViajes_SFact
Do While Not rsLiqDetViajes.EOF
    .AddNew
    .Fields("Fecha") = rsLiqDetViajes!Fecha
    .Fields("CodEmpresa") = rsLiqDetViajes!CodEmpresa
    .Fields("DescEmpresa") = rsLiqDetViajes!DescEmpresa
    .Fields("NroRem") = rsLiqDetViajes!NroRemito
    .Fields("CodChofer") = rsLiqDetViajes!CodChofer
    .Fields("DescChofer") = rsLiqDetViajes!DescChofer
    .Fields("Mercaderia") = rsLiqDetViajes!Mercaderia
    .Fields("Procedencia") = rsLiqDetViajes!Procedencia
    .Fields("Destino") = rsLiqDetViajes!Destino
    .Fields("Kilos") = rsLiqDetViajes!Kilos
    .Fields("Tarifa") = rsLiqDetViajes!Tarifa
    .Fields("STotal") = rsLiqDetViajes!SubTotal
    .Update
    rsLiqDetViajes.MoveNext
Loop
End With
Set rsLiqDetViajes = Nothing
Set rsViajes_SFact = Nothing
Dim frmRep As New InfViajesPendEmp
frmRep.Show vbModal
End Sub

Private Sub Form_Load()
Set rsEmpresas = db.OpenRecordset("Select * From Empresas Order By DescEmpresas")
Do While Not rsEmpresas.EOF
    Combo1.AddItem rsEmpresas!DescEmpresas
    rsEmpresas.MoveNext
Loop
Set rsEmpresas = Nothing
Combo1.ListIndex = 0
Combo1.Enabled = False
Option1(0).Value = True
End Sub

Private Sub Option1_Click(Index As Integer)
If Index = 1 Then
    Combo1.Enabled = True
Else
    Combo1.Enabled = False
End If
End Sub
